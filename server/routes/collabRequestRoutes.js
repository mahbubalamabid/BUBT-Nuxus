import express from "express";
import {
  sendCollabRequest,
  getReceivedRequests,
  getSentRequests,
  respondToRequest,
} from "../controllers/collabRequestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", sendCollabRequest);
router.get("/received", getReceivedRequests);
router.get("/sent", getSentRequests);
router.put("/:id", respondToRequest);

export default router;
