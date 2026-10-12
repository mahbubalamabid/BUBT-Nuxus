import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Get all users with optional filters (interests, skills, search, department)
// @route   GET /api/users
// @access  Public (excludes yourself from results if logged in)
export const getUsers = asyncHandler(async (req, res) => {
  const { interest, skill, q, department, role, page = 1, limit = 12 } =
    req.query;

  const filter = req.user ? { _id: { $ne: req.user._id } } : {};

  if (interest && interest.trim()) {
    filter.interests = { $regex: escapeRegex(interest.trim()), $options: "i" };
  }
  if (skill && skill.trim()) {
    filter.skills = { $regex: escapeRegex(skill.trim()), $options: "i" };
  }
  if (department) filter.department = department;
  if (role) filter.role = role;
  if (q && q.trim()) {
    const safeQ = escapeRegex(q.trim());
    filter.$or = [
      { name: { $regex: safeQ, $options: "i" } },
      { bio: { $regex: safeQ, $options: "i" } },
      { interests: { $regex: safeQ, $options: "i" } },
      { skills: { $regex: safeQ, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: users.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: users,
  });
});

// @desc    Get single user profile
// @route   GET /api/users/:id
// @access  Public
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, data: user });
});

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const {
    name,
    bio,
    department,
    studentOrEmployeeId,
    avatar,
    interests,
    skills,
    publications,
    links,
    isAvailableForCollab,
  } = req.body;

  user.name = name ?? user.name;
  user.bio = bio ?? user.bio;
  user.department = department ?? user.department;
  user.studentOrEmployeeId = studentOrEmployeeId ?? user.studentOrEmployeeId;
  user.avatar = avatar ?? user.avatar;
  if (Array.isArray(interests)) user.interests = interests;
  if (Array.isArray(skills)) user.skills = skills;
  if (Array.isArray(publications)) user.publications = publications;
  if (links) user.links = { ...user.links.toObject(), ...links };
  if (typeof isAvailableForCollab === "boolean")
    user.isAvailableForCollab = isAvailableForCollab;

  const updatedUser = await user.save();
  res.json({ success: true, data: updatedUser });
});

// @desc    Get list of distinct interest tags (for tag suggestions/autocomplete)
// @route   GET /api/users/meta/tags
// @access  Private
export const getAllTags = asyncHandler(async (req, res) => {
  const interests = await User.distinct("interests");
  const skills = await User.distinct("skills");
  res.json({ success: true, data: { interests, skills } });
});
