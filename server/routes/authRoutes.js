import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
  resendVerification,
  googleAuth,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);
router.get("/me", protect, getMe);

export default router;
