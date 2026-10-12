import asyncHandler from "express-async-handler";
import Project from "../models/Project.js";

// @desc    Create a new project posting
// @route   POST /api/projects
// @access  Private
export const createProject = asyncHandler(async (req, res) => {
  const { title, description, maxCollaborators, deadline } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error("Title and description are required");
  }

  // multipart/form-data sends everything as strings, so array fields arrive
  // JSON-encoded from the client (see client/src/services/projectService.js).
  const tags = parseArrayField(req.body.tags);
  const requiredSkills = parseArrayField(req.body.requiredSkills);

  const attachments = (req.files || []).map((file) => ({
    filename: file.originalname,
    url: `/uploads/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
  }));

  const project = await Project.create({
    title,
    description,
    tags,
    requiredSkills,
    maxCollaborators,
    deadline,
    owner: req.user._id,
    approvalStatus: "pending",
    attachments,
  });

  const populated = await project.populate("owner", "name avatar department role");

  res.status(201).json({
    success: true,
    message:
      "Your project has been submitted and is awaiting admin approval before it becomes visible to others.",
    data: populated,
  });
});

// Array fields (tags, requiredSkills) come through as a JSON string when the
// request is multipart/form-data (needed for file uploads), but as a real
// array when the request is plain JSON (e.g. from updateProject callers that
// don't attach files). Handle both.
function parseArrayField(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Get all projects with filters (tags, skills, search, status)
// @route   GET /api/projects
// @access  Public (personalized if logged in)
export const getProjects = asyncHandler(async (req, res) => {
  const { tag, skill, q, status, owner, approvalStatus, page = 1, limit = 12 } =
    req.query;

  const filter = {};
  if (tag && tag.trim()) {
    filter.tags = { $regex: escapeRegex(tag.trim()), $options: "i" };
  }
  if (skill && skill.trim()) {
    filter.requiredSkills = { $regex: escapeRegex(skill.trim()), $options: "i" };
  }
  if (status) filter.status = status;
  if (owner) filter.owner = owner;
  if (q && q.trim()) {
    const safeQ = escapeRegex(q.trim());
    filter.$or = [
      { title: { $regex: safeQ, $options: "i" } },
      { description: { $regex: safeQ, $options: "i" } },
      { tags: { $regex: safeQ, $options: "i" } },
      { requiredSkills: { $regex: safeQ, $options: "i" } },
    ];
  }

  // Public listings only ever show admin-approved projects. The one exception
  // is a logged-in user requesting their own projects (owner === themselves),
  // who may also see their pending/rejected posts and optionally filter by
  // status. Guests (req.user undefined) always fall into the approved-only case.
  const isOwnProjectsQuery = !!(owner && req.user && owner === req.user._id.toString());
  if (isOwnProjectsQuery) {
    if (approvalStatus) filter.approvalStatus = approvalStatus;
  } else {
    filter.approvalStatus = "approved";
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate("owner", "name avatar department role")
      .populate("collaborators", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Project.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: projects.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: projects,
  });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public (personalized if logged in)
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("owner", "name avatar department role bio")
    .populate("collaborators", "name avatar department");

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const isOwner = !!(req.user && project.owner._id.toString() === req.user._id.toString());
  const isAdmin = req.user?.role === "admin";

  if (project.approvalStatus !== "approved" && !isOwner && !isAdmin) {
    // Don't leak that a pending/rejected project exists to anyone but its
    // owner or an admin - respond the same way as a truly missing project.
    res.status(404);
    throw new Error("Project not found");
  }

  res.json({ success: true, data: project });
});

// @desc    Update a project (owner only)
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this project");
  }

  const fields = ["title", "description", "status", "maxCollaborators", "deadline"];
  // Editing content the admin already reviewed (or rejected) means it needs a
  // fresh look - otherwise someone could get approved once and then edit the
  // post into something that was never actually reviewed.
  const contentFields = ["title", "description", "tags", "requiredSkills"];
  const isEditingContent = contentFields.some((field) => req.body[field] !== undefined);

  fields.forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });

  // tags/requiredSkills need the same array-or-JSON-string handling as
  // createProject, since they arrive as JSON strings when the request is
  // multipart/form-data (i.e. when files are also being uploaded).
  if (req.body.tags !== undefined) project.tags = parseArrayField(req.body.tags);
  if (req.body.requiredSkills !== undefined) {
    project.requiredSkills = parseArrayField(req.body.requiredSkills);
  }

  // Let the owner drop attachments they no longer want, before adding any
  // newly uploaded ones.
  const removedIds = parseArrayField(req.body.removedAttachmentIds);
  if (removedIds.length > 0) {
    project.attachments = project.attachments.filter(
      (a) => !removedIds.includes(a._id.toString())
    );
  }

  if (req.files && req.files.length > 0) {
    const newAttachments = req.files.map((file) => ({
      filename: file.originalname,
      url: `/uploads/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
    }));
    project.attachments = [...(project.attachments || []), ...newAttachments];
  }

  if (isEditingContent && project.approvalStatus !== "pending") {
    project.approvalStatus = "pending";
    project.rejectionReason = "";
  }

  const updated = await project.save();
  res.json({
    success: true,
    message: isEditingContent
      ? "Project updated. Since you changed the content, it's back in the admin review queue."
      : "Project updated.",
    data: updated,
  });
});

// @desc    Delete a project (owner only)
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this project");
  }

  await project.deleteOne();
  res.json({ success: true, data: {} });
});
