import asyncHandler from "express-async-handler";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate("participants", "name avatar department")
    .sort({ lastMessageAt: -1 });

  res.json({ success: true, data: conversations });
});

// @desc    Start (or fetch existing) a conversation with another user
// @route   POST /api/messages/conversations
// @access  Private
export const startConversation = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error("userId is required");
  }

  if (userId === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot start a conversation with yourself");
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, userId], $size: 2 },
  }).populate("participants", "name avatar department");

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, userId],
    });
    conversation = await conversation.populate(
      "participants",
      "name avatar department"
    );
  }

  res.status(201).json({ success: true, data: conversation });
});

// @desc    Get messages in a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.conversationId);

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
    res.status(403);
    throw new Error("Not authorized to view this conversation");
  }

  const messages = await Message.find({
    conversation: req.params.conversationId,
  })
    .populate("sender", "name avatar")
    .sort({ createdAt: 1 });

  // Mark messages sent to me as read
  await Message.updateMany(
    { conversation: req.params.conversationId, sender: { $ne: req.user._id }, read: false },
    { $set: { read: true } }
  );

  res.json({ success: true, data: messages });
});

// @desc    Send a message in a conversation
// @route   POST /api/messages/:conversationId
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Message text is required");
  }

  const conversation = await Conversation.findById(req.params.conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
    res.status(403);
    throw new Error("Not authorized to message in this conversation");
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: text.trim(),
  });

  conversation.lastMessage = text.trim();
  conversation.lastMessageAt = new Date();
  await conversation.save();

  const populated = await message.populate("sender", "name avatar");

  // Emit via socket.io if available
  const io = req.app.get("io");
  if (io) {
    io.to(conversation._id.toString()).emit("newMessage", populated);
  }

  res.status(201).json({ success: true, data: populated });
});
