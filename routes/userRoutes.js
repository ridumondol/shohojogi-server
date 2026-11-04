import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
  initiateGoogleOAuth,
  handleGoogleOAuthCallback,
  initiateGitHubOAuth,
  handleGitHubOAuthCallback,
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { loginRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public auth endpoints
router.post("/register", registerUser);
router.post("/login", loginRateLimiter, loginUser);
router.post("/logout", logoutUser);

// Social authentication: Google & GitHub OAuth 2.0
router.get("/oauth/google", initiateGoogleOAuth);
router.get("/oauth/google/callback", handleGoogleOAuthCallback);
router.get("/oauth/github", initiateGitHubOAuth);
router.get("/oauth/github/callback", handleGitHubOAuthCallback);

// Protected user profile routes
router.get("/profile", verifyToken, getMyProfile);
router.put("/profile", verifyToken, updateMyProfile);
router.put("/change-password", verifyToken, changePassword);

export default router;
