import asyncHandler from "express-async-handler";
import CollabRequest from "../models/CollabRequest.js";
import Project from "../models/Project.js";
import Conversation from "../models/Conversation.js";

// @desc    Send a collaboration request to a project owner
// @route   POST /api/collab-requests
// @access  Private
export const sendCollabRequest = asyncHandler(async (req, res) => {
  const { projectId, message } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  if (project.approvalStatus !== "approved") {
    res.status(400);
    throw new Error("This project is not yet approved and cannot receive collaboration requests");
  }

  if (project.owner.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot request to collaborate on your own project");
  }

  const existing = await CollabRequest.findOne({
    project: projectId,
    sender: req.user._id,
    status: "pending",
  });
  if (existing) {
    res.status(400);
    throw new Error("You already have a pending request for this project");
  }

  const collabRequest = await CollabRequest.create({
    project: projectId,
    sender: req.user._id,
    receiver: project.owner,
    message,
  });

  const populated = await collabRequest.populate([
    { path: "sender", select: "name avatar department" },
    { path: "project", select: "title" },
  ]);

  res.status(201).json({ success: true, data: populated });
});

// @desc    Get requests received by current user (as project owner)
// @route   GET /api/collab-requests/received
// @access  Private
export const getReceivedRequests = asyncHandler(async (req, res) => {
  const requests = await CollabRequest.find({ receiver: req.user._id })
    .populate("sender", "name avatar department skills interests")
    .populate("project", "title status")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

// @desc    Get requests sent by current user
// @route   GET /api/collab-requests/sent
// @access  Private
export const getSentRequests = asyncHandler(async (req, res) => {
  const requests = await CollabRequest.find({ sender: req.user._id })
    .populate("receiver", "name avatar department")
    .populate("project", "title status")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

// @desc    Respond to a collaboration request (accept/reject)
// @route   PUT /api/collab-requests/:id
// @access  Private
export const respondToRequest = asyncHandler(async (req, res) => {
  const { status } = req.body; // "accepted" | "rejected"

  if (!["accepted", "rejected"].includes(status)) {
    res.status(400);
    throw new Error("Status must be 'accepted' or 'rejected'");
  }

  const collabRequest = await CollabRequest.findById(req.params.id);
  if (!collabRequest) {
    res.status(404);
    throw new Error("Request not found");
  }

  if (collabRequest.receiver.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to respond to this request");
  }

  collabRequest.status = status;
  await collabRequest.save();

  // If accepted, add sender as a collaborator on the project + start a conversation
  if (status === "accepted") {
    await Project.findByIdAndUpdate(collabRequest.project, {
      $addToSet: { collaborators: collabRequest.sender },
    });

    const existingConvo = await Conversation.findOne({
      participants: { $all: [collabRequest.sender, collabRequest.receiver], $size: 2 },
    });

    if (!existingConvo) {
      await Conversation.create({
        participants: [collabRequest.sender, collabRequest.receiver],
        lastMessage: "You are now connected as collaborators!",
      });
    }
  }

  const populated = await collabRequest.populate([
    { path: "sender", select: "name avatar" },
    { path: "project", select: "title" },
  ]);

  res.json({ success: true, data: populated });
});
