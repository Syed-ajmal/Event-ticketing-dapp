import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: [true, "Username must be unique"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email must be unique"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // hidden from normal queries
    },
    role: {
      type: String,
      enum: ["admin", "creator", "attendee"],
      default: "attendee",
    },
    walletAddress: {
      type: String,
      lowercase: true,
      unique: true,
      sparse: true, // many users can have no wallet
    },
    walletNonce: { type: String },
  },
  { timestamps: true }, // message to sign when linking a wallet
);

const userModel = mongoose.model("users", userSchema);

export default userModel;
