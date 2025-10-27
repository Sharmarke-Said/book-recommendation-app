import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
  getUserProfile,
  updateMe,
  uploadUserPhoto,
  resizeUserPhoto,
} from "../controllers/userController.js";
import { updatePassword } from "../controllers/authController.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);
router.patch(
  "/update-me",
  protect,
  uploadUserPhoto,
  resizeUserPhoto,
  updateMe
);
router.patch("/updateMyPassword", protect, updatePassword);

export default router;
