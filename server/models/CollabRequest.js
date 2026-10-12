import mongoose from "mongoose";

const collabRequestSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Prevent duplicate pending requests for the same project by the same sender
collabRequestSchema.index(
  { project: 1, sender: 1, status: 1 },
  { unique: false }
);

const CollabRequest = mongoose.model("CollabRequest", collabRequestSchema);
export default CollabRequest;
