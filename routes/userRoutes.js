import express from "express";

import {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
} from "../controllers/userController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Get Profile
router.get("/profile", verifyToken, getMyProfile);

// Update Profile
router.put("/profile", verifyToken, updateMyProfile);

// Change Password
router.put("/change-password", verifyToken, changePassword);

export default router;