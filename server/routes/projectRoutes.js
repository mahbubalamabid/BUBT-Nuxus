import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Browsing projects is public (guests can see approved projects); posting,
// editing, and deleting still require a logged-in owner.
router
  .route("/")
  .get(optionalAuth, getProjects)
  .post(protect, upload.array("attachments", 3), createProject);

router
  .route("/:id")
  .get(optionalAuth, getProjectById)
  .put(protect, upload.array("attachments", 3), updateProject)
  .delete(protect, deleteProject);

export default router;
