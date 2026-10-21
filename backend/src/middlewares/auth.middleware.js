import jwt from "jsonwebtoken";
import sessionModel from "../models/session.model.js";
import userModel from "../models/user.model.js";
import config from "../config/config.js";

export async function authUser(req, res, next) {
  try {
    const [scheme, token] = req.headers.authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (!decoded.userId || !decoded.sessionId) {
      return res.status(401).json({ message: "Invalid access token" });
    }

    const session = await sessionModel.findOne({
      _id: decoded.sessionId,
      user: decoded.userId,
      revoked: false,
    });

    if (!session) {
      return res.status(401).json({ message: "Session is invalid or expired" });
    }

    const user = await userModel.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    req.session = session;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

export async function authAdmin(req, res, next) {
  try {
    await authUser(req, res, async () => {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    });
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}