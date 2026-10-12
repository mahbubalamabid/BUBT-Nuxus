import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: function () {
        // Password is only required for accounts that sign up with email/password.
        // Google accounts authenticate via verified ID tokens instead.
        return this.authProvider === "local";
      },
      minlength: 6,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows many docs with no googleId while still enforcing uniqueness when present
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "researcher", "faculty", "admin"],
      default: "student",
    },
    // Lets an admin suspend an account without deleting it. Suspended users
    // are blocked at login regardless of password correctness.
    isActive: {
      type: Boolean,
      default: true,
    },
    studentOrEmployeeId: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 600,
      default: "",
    },
    // Research profile
    interests: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    publications: [
      {
        title: { type: String, trim: true },
        link: { type: String, trim: true },
        year: { type: Number },
      },
    ],
    links: {
      googleScholar: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    isAvailableForCollab: {
      type: Boolean,
      default: true,
    },
    // Email verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Index for searching by tags/skills/name
userSchema.index({ interests: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ name: "text", bio: "text" });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Google-only account, no local password to compare
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
