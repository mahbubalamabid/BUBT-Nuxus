import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    requiredSkills: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    status: {
      type: String,
      enum: ["open", "in-progress", "closed"],
      default: "open",
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxCollaborators: {
      type: Number,
      default: 5,
    },
    deadline: {
      type: Date,
    },
    // Admin moderation - every new project starts pending and is only
    // publicly visible once an admin approves it.
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    // Files/images the owner attached when posting (images, PDFs, docs).
    // Stored on disk under server/uploads, served statically; only the
    // metadata + relative URL lives in the database.
    attachments: [
      {
        filename: { type: String, required: true }, // original filename shown to users
        url: { type: String, required: true },        // e.g. /uploads/16920001-file.pdf
        mimetype: { type: String },
        size: { type: Number }, // bytes
      },
    ],
  },
  { timestamps: true }
);

projectSchema.index({ tags: 1 });
projectSchema.index({ requiredSkills: 1 });
projectSchema.index({ title: "text", description: "text" });
projectSchema.index({ approvalStatus: 1 });

const Project = mongoose.model("Project", projectSchema);
export default Project;
