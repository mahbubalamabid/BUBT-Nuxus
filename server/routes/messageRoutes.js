import express from "express";
import {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/conversations").get(getConversations).post(startConversation);
router.route("/:conversationId").get(getMessages).post(sendMessage);

export default router;
