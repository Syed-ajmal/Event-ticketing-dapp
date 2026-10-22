import creatorRequestModel from "../models/creatorRequest.model.js";
import {
  prepareEventCreatorRoleGrant,
  verifyEventCreatorRoleGrant,
} from "../services/eventTicketing.js";

export async function request(req, res) {
  try {
    const user = req.user;

    if (user.role !== "attendee") {
      return res.status(409).json({
        message: "Only attendee accounts can request creator access",
      });
    }

    if (!user.walletAddress) {
      return res.status(400).json({
        message: "Link and verify a wallet before requesting creator access",
      });
    }

    const rawOrgName = req.body?.orgName ?? "";
    const rawMessage = req.body?.message ?? "";

    if (typeof rawOrgName !== "string" || typeof rawMessage !== "string") {
      return res.status(400).json({
        message: "orgName and message must be strings",
      });
    }

    const orgName = rawOrgName.trim();
    const message = rawMessage.trim();
    
    if (orgName.length > 200 || message.length > 1000) {
      return res.status(400).json({
        message: "orgName must be 200 characters or fewer and message 1000 or fewer",
      });
    }

    let creatorRequest = await creatorRequestModel.findOne({ user: user._id });

    if (creatorRequest?.status === "pending") {
      return res.status(409).json({ message: "You already have a pending request" });
    }

    if (creatorRequest?.status === "approved") {
      return res.status(409).json({ message: "Your creator request is already approved" });
    }

    if (creatorRequest) {
      creatorRequest.walletAddress = user.walletAddress;
      creatorRequest.orgName = orgName;
      creatorRequest.message = message;
      creatorRequest.status = "pending";
      creatorRequest.reviewedBy = undefined;
      creatorRequest.reviewedAt = undefined;
      creatorRequest.rejectionReason = undefined;
      creatorRequest.txHash = undefined;
      await creatorRequest.save();
    } else {
      creatorRequest = await creatorRequestModel.create({
        user: user._id,
        walletAddress: user.walletAddress,
        orgName,
        message,
      });
    }

    return res.status(201).json({
      message: "Creator access request submitted for admin review",
      request: {
        id: creatorRequest._id,
        status: creatorRequest.status,
        walletAddress: creatorRequest.walletAddress,
        orgName: creatorRequest.orgName,
        message: creatorRequest.message,
        submittedAt: creatorRequest.updatedAt,
      },
    });
  } catch (error) {
    console.error("Creator request failed:", error);
    return res.status(500).json({ message: "Could not submit creator request" });
  }
}

export async function listPending(req, res) {
  try {
    const requests = await creatorRequestModel
      .find({ status: "pending" })
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Pending creator requests fetch failed:", error);
    return res.status(500).json({ message: "Could not load creator requests" });
  }
}

export async function approve(req, res) {
  try {
    const creatorRequest = await creatorRequestModel
      .findById(req.params.requestId)
      .populate("user", "role walletAddress");

    if (!creatorRequest) {
      return res.status(404).json({ message: "Creator request not found" });
    }

    if (creatorRequest.status !== "pending") {
      return res.status(409).json({
        message: `Request is already ${creatorRequest.status}`,
      });
    }

    const targetUser = creatorRequest.user;
    if (!targetUser) {
      return res.status(404).json({ message: "Request user not found" });
    }

    if (!targetUser.walletAddress) {
      return res.status(400).json({ message: "User has no linked wallet address" });
    }

    const adminWalletAddress = req.user.walletAddress;
    if (!adminWalletAddress) {
      return res.status(400).json({ message: "Link an admin wallet before approving requests" });
    }

    // First call prepares the wallet transaction; the client signs and submits
    // it, then retries with transactionHash so the backend can verify it.
    if (!req.body?.transactionHash) {
      const grantResult = await prepareEventCreatorRoleGrant(
        adminWalletAddress,
        targetUser.walletAddress,
      );

      if (grantResult.alreadyGranted) {
        return finalizeCreatorApproval(req, res, creatorRequest, targetUser, {
          ...grantResult,
          txHash: creatorRequest.txHash ?? null,
        });
      }

      return res.status(200).json({
        message: "Sign and submit this transaction with the admin wallet, then send its hash to approve",
        requestId: creatorRequest._id,
        walletAddress: grantResult.walletAddress,
        transaction: grantResult.transaction,
      });
    }

    const grantResult = await verifyEventCreatorRoleGrant(
      req.body.transactionHash,
      adminWalletAddress,
      targetUser.walletAddress,
    );

    return finalizeCreatorApproval(req, res, creatorRequest, targetUser, grantResult);
  } catch (error) {
    console.error("Creator approval failed:", error);
    const clientErrors = [
      "Authenticated admin wallet does not have DEFAULT_ADMIN_ROLE",
      "The creator or admin wallet address is invalid",
      "A valid transaction hash is required",
      "Transaction not found; wait for confirmation and retry",
      "Transaction is not a creator role grant",
      "Transaction sender does not match this approval",
      "Transaction does not grant creator role to the requested wallet",
      "Creator role grant is not visible on chain yet",
      "The transaction to grant creator role failed",
    ];
    if (clientErrors.includes(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Could not approve creator request" });
  }
}

async function finalizeCreatorApproval(req, res, creatorRequest, targetUser, grantResult) {
  targetUser.role = "creator";
  creatorRequest.status = "approved";
  creatorRequest.reviewedBy = req.user._id;
  creatorRequest.reviewedAt = new Date();
  creatorRequest.walletAddress = grantResult.walletAddress.toLowerCase();
  creatorRequest.txHash = grantResult.txHash ?? creatorRequest.txHash;

  await targetUser.save();
  await creatorRequest.save();

  return res.status(200).json({
    message: "Creator request approved",
    requestId: creatorRequest._id,
    userId: targetUser._id,
    walletAddress: grantResult.walletAddress,
    role: targetUser.role,
    alreadyGranted: grantResult.alreadyGranted,
    transactionHash: grantResult.txHash,
  });
}
