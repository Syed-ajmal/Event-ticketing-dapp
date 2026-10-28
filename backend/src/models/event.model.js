import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    creatorWalletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    startsAt: { type: Number, required: true },
    endsAt: { type: Number, required: true },
    ticketLimit: { type: Number, required: true },
    // Store uint96 as a decimal string because it can exceed JS's safe integer range.
    ticketPrice: { type: String, required: true },
    metadataURI: { type: String, required: true, trim: true },
    transactionHash: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    cancelled: { type: Boolean, default: false, index: true },
    cancellationTransactionHash: { type: String, lowercase: true },
    cancelledAt: Date,
    proceedsWithdrawn: { type: Boolean, default: false },
    proceedsWithdrawnAt: Date,
    proceedsWithdrawalAmount: String,
    proceedsWithdrawalTransactionHash: { type: String, lowercase: true },
  },
  { timestamps: true },
);

const eventModel = mongoose.model("events", eventSchema);

export default eventModel;
