import express from "express";
import {
  getAllEvents,
  getFeaturedEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  cancelEventParticipation,
  getMyEvents,
  getMyJoinedEvents,
} from "../controllers/eventController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public event discovery and event details.
router.get("/", getAllEvents);
router.get("/featured", getFeaturedEvents);
router.get("/my-events", verifyToken, getMyEvents);
router.get("/my-joined-events", verifyToken, getMyJoinedEvents);
router.get("/:id", getEventById);

// Authenticated event management and participation.
router.post("/", verifyToken, createEvent);
router.put("/:id", verifyToken, updateEvent);
router.delete("/:id", verifyToken, deleteEvent);
router.post("/:id/join", verifyToken, joinEvent);
router.delete("/:id/join", verifyToken, cancelEventParticipation);

export default router;
