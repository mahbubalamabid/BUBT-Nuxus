import express from "express";
import {
  getUsers,
  getUserById,
  updateProfile,
  getAllTags,
} from "../controllers/userController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Browsing researchers/profiles and tag suggestions are public; editing your
// own profile still requires being logged in.
router.get("/", optionalAuth, getUsers);
router.get("/meta/tags", optionalAuth, getAllTags);
router.put("/profile", protect, updateProfile);
router.get("/:id", optionalAuth, getUserById);

export default router;
