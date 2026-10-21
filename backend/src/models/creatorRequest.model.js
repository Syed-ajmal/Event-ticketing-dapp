import mongoose from "mongoose";

const creatorRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    orgName: { type: String, trim: true, maxlength: 200, default: "" },
    message: { type: String, trim: true, maxlength: 1000, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    reviewedAt: Date,
    rejectionReason: { type: String, trim: true, maxlength: 1000 },
    txHash: { type: String },
  },
  { timestamps: true },
);

const creatorRequestModel = mongoose.model("creatorRequests", creatorRequestSchema);

export default creatorRequestModel;
