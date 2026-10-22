import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";
import creatorRequestModel from "../models/creatorRequest.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { getAddress, verifyMessage } from "ethers";

const WALLET_NONCE_TTL_MS = 5 * 60 * 1000;

export async function register(req, res) {
  try {
    let { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    username = username.trim();
    email = email.trim().toLowerCase();

    const isAlreadyRegistered = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isAlreadyRegistered) {
      return res.status(409).json({
        message: "Username or Email already exist",
      });
    }

    const hashPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const user = await userModel.create({
      username,
      email,
      password: hashPassword,
    });

    const refreshToken = jwt.sign(
      {
        userId: user._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await sessionModel.create({
      user: user._id,
      refreshTokenHash,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const accessToken = jwt.sign(
      {
        userId: user._id,
        sessionId: session._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: "User register sucessfully",
      user: {
        username: user.username,
        email: user.email,
      },
      accessToken,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Username or Email already exist" });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function login(req, res) {
  try {
    let { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    email = email.trim().toLowerCase();

    const user = await userModel
      .findOne({
        email,
      })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const hashPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const isPasswordValid = hashPassword === user.password;

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const refreshToken = jwt.sign(
      {
        userId: user._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await sessionModel.create({
      user: user._id,
      refreshTokenHash,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const accessToken = jwt.sign(
      {
        userId: user._id,
        sessionId: session._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "User logged in successfully",
      user: {
        username: user.username,
        email: user.email,
      },
      accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getMe(req, res) {
  const user = req.user;

  res.status(200).json({
    message: "User fetched successfully",
    user: {
      username: user.username,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress || null,
    },
  });
}

export async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token not found",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET);
  } catch {
    return res.status(401).json({
      message: "Invalid or expired refresh token",
    });
  }

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.findOne({
    refreshTokenHash,
    revoked: false,
  });

  if (!session) {
    return res.status(401).json({
      message: "Session not found",
    });
  }

  const accessToken = jwt.sign(
    {
      userId: session.user,
      sessionId: session._id,
    },
    config.JWT_SECRET,
    { expiresIn: "15m" },
  );

  // Additional level of security
  const newRefreshToken = jwt.sign(
    {
      userId: decoded.userId,
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  const newRefreshTokenHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  session.refreshTokenHash = newRefreshTokenHash;
  await session.save();

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    message: "Access token refreshed successfully",
    accessToken,
  });
}

export async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token not found",
    });
  }

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.findOne({
    refreshTokenHash,
    revoked: false,
  });

  if (!session) {
    return res.status(400).json({
      message: "Session not found",
    });
  }

  session.revoked = true;
  await session.save();

  res.clearCookie("refreshToken");

  res.status(200).json({
    message: "User logged out successfully",
  });
}

export async function logoutAll(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token not found",
    });
  }

  const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

  await sessionModel.updateMany(
    {
      user: decoded.userId,
      revoked: false,
    },
    {
      revoked: true,
    },
  );

  res.clearCookie("refreshToken");

  res.status(200).json({
    message: "User logged out from all devices successfully",
  });
}

export async function getWalletNonce(req, res) {
  try {
    const nonce = crypto.randomBytes(32).toString("hex");

    await userModel.findByIdAndUpdate(req.user._id, {
      walletNonce: nonce,
      walletNonceExpiresAt: new Date(Date.now() + WALLET_NONCE_TTL_MS),
    });

    return res.status(200).json({
      message: "Sign this message to link your wallet",
      nonce,
      messageToSign: `Link wallet to your account. Nonce: ${nonce}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function linkWallet(req, res) {
  try {
    const { walletAddress, signature } = req.body;

    if (
      typeof walletAddress !== "string" ||
      typeof signature !== "string" ||
      !walletAddress.trim() ||
      !signature.trim()
    ) {
      return res
        .status(400)
        .json({ message: "Wallet address and signature are required" });
    }

    const user = await userModel
      .findById(req.user._id)
      .select("+walletNonce +walletNonceExpiresAt");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // creators and admins can't change wallet (their on-chain role is tied to it)
    if (user.walletAddress && ["creator", "admin"].includes(user.role)) {
      return res.status(403).json({
        message: "Wallet can't be changed for creators",
      });
    }

    // can't change wallet while a creator request is pending
    const hasPending = await creatorRequestModel.exists({
      user: user._id,
      status: "pending",
    });

    if (hasPending) {
      return res.status(409).json({
        message:
          "You have a pending creator request. Wallet can't be changed now.",
      });
    }

    if (!user.walletNonce || !user.walletNonceExpiresAt) {
      return res.status(400).json({ message: "Request a wallet nonce first" });
    }

    if (user.walletNonceExpiresAt <= new Date()) {
      user.walletNonce = undefined;
      user.walletNonceExpiresAt = undefined;
      await user.save();
      return res.status(400).json({ message: "Nonce expired. Request a new one." });
    }

    const messageToSign = `Link wallet to your account. Nonce: ${user.walletNonce}`;
    const recoveredAddress = getAddress(
      verifyMessage(messageToSign, signature),
    );
    const submittedAddress = getAddress(walletAddress);

    if (recoveredAddress !== submittedAddress) {
      return res.status(401).json({ message: "Invalid wallet signature" });
    }

    user.walletAddress = submittedAddress.toLowerCase();
    user.walletNonce = undefined;
    user.walletNonceExpiresAt = undefined;
    await user.save();

    return res.status(200).json({
      message: "Wallet linked successfully",
      walletAddress: user.walletAddress,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Wallet is already linked" });
    }

    if (err.code === "INVALID_ARGUMENT") {
      return res
        .status(400)
        .json({ message: "Invalid wallet address or signature" });
    }

    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
