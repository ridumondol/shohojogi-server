
import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected Dashboard Statistics Route
router.get("/stats", verifyToken, getDashboardStats);

export default router;
