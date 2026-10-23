import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true },
    eventId: { type: String, required: true, index: true },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "events",
      required: true,
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    attendeeWalletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    transactionHash: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
  },
  { timestamps: true },
);

ticketSchema.index({ eventId: 1, ticketId: 1 }, { unique: true });

const ticketModel = mongoose.model("tickets", ticketSchema);

export default ticketModel;
