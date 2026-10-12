import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Project from "../models/Project.js";
import CollabRequest from "../models/CollabRequest.js";
import generateToken from "../utils/generateToken.js";

// @desc    Admin login - separate from the regular user login. Only succeeds
//          for accounts with role "admin"; regular users get a clear rejection
//          rather than a generic auth error, so the panel can't be confused
//          with the normal sign-in flow.
// @route   POST /api/admin/login
// @access  Public
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || user.role !== "admin") {
    res.status(403);
    throw new Error("No admin account found with these credentials");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("This admin account has been deactivated");
  }

  const matches = await user.matchPassword(password);
  if (!matches) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    },
  });
});

// @desc    Dashboard summary counts
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProjects, pendingApprovals, totalCollabRequests] =
    await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      Project.countDocuments(),
      Project.countDocuments({ approvalStatus: "pending" }),
      CollabRequest.countDocuments(),
    ]);

  res.json({
    success: true,
    data: { totalUsers, totalProjects, pendingApprovals, totalCollabRequests },
  });
});

// @desc    List projects awaiting approval, oldest first (fair review queue)
// @route   GET /api/admin/projects/pending
// @access  Private/Admin
export const getPendingProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ approvalStatus: "pending" })
    .populate("owner", "name email department role")
    .sort({ createdAt: 1 });

  res.json({ success: true, count: projects.length, data: projects });
});

// @desc    List all projects regardless of approval status, with optional filter
// @route   GET /api/admin/projects?approvalStatus=&q=
// @access  Private/Admin
export const getAllProjectsAdmin = asyncHandler(async (req, res) => {
  const { approvalStatus, q } = req.query;
  const filter = {};
  if (approvalStatus) filter.approvalStatus = approvalStatus;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  const projects = await Project.find(filter)
    .populate("owner", "name email department role")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: projects.length, data: projects });
});

// @desc    Approve a pending (or previously rejected) project, making it publicly visible
// @route   PUT /api/admin/projects/:id/approve
// @access  Private/Admin
export const approveProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  project.approvalStatus = "approved";
  project.rejectionReason = "";
  project.reviewedBy = req.user._id;
  project.reviewedAt = new Date();
  await project.save();

  res.json({ success: true, data: project });
});

// @desc    Reject a project with a reason the owner can see and act on
// @route   PUT /api/admin/projects/:id/reject
// @access  Private/Admin
export const rejectProject = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  project.approvalStatus = "rejected";
  project.rejectionReason = reason || "Did not meet platform guidelines.";
  project.reviewedBy = req.user._id;
  project.reviewedAt = new Date();
  await project.save();

  res.json({ success: true, data: project });
});

// @desc    Admin can remove any project outright (e.g. spam, policy violation)
// @route   DELETE /api/admin/projects/:id
// @access  Private/Admin
export const deleteProjectAdmin = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  await project.deleteOne();
  res.json({ success: true, data: {} });
});

// @desc    List all non-admin users for moderation
// @route   GET /api/admin/users?q=
// @access  Private/Admin
export const getAllUsersAdmin = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = { role: { $ne: "admin" } };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

// @desc    Suspend or reactivate a user account
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private/Admin
export const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.role === "admin") {
    res.status(400);
    throw new Error("Cannot suspend another admin account from here");
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({ success: true, data: user });
});
