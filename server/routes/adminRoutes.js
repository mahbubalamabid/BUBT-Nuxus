import express from "express";
import {
  adminLogin,
  getDashboardStats,
  getPendingProjects,
  getAllProjectsAdmin,
  approveProject,
  rejectProject,
  deleteProjectAdmin,
  getAllUsersAdmin,
  toggleUserActive,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);

// Everything below requires a valid JWT AND role === "admin"
router.use(protect, adminOnly);

router.get("/stats", getDashboardStats);

router.get("/projects/pending", getPendingProjects);
router.get("/projects", getAllProjectsAdmin);
router.put("/projects/:id/approve", approveProject);
router.put("/projects/:id/reject", rejectProject);
router.delete("/projects/:id", deleteProjectAdmin);

router.get("/users", getAllUsersAdmin);
router.put("/users/:id/toggle-active", toggleUserActive);

export default router;
