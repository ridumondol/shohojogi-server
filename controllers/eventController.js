import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const EVENT_FIELDS = ["title", "category", "date", "location", "image", "description"];
const EVENT_CATEGORIES = new Set(["Cleanup", "Plantation", "Donation", "Education", "Healthcare", "Health", "Food", "Relief", "Blood Donation", "Volunteer", "Community", "Community Support", "Environment", "Other"]);

export function validateEventInput(body) {
  const values = Object.fromEntries(
    EVENT_FIELDS.map((field) => [field, typeof body?.[field] === "string" ? body[field].trim() : ""])
  );
  const missing = EVENT_FIELDS.filter((field) => !values[field]);

  if (missing.length) {
    return { error: `Required event fields are missing: ${missing.join(", ")}.` };
  }

  if (!EVENT_CATEGORIES.has(values.category)) {
    return { error: "Please select a valid event type." };
  }

  let parsedDate;
  if (/^\d{4}-\d{2}-\d{2}$/.test(values.date)) {
    const [year, month, day] = values.date.split("-").map(Number);
    parsedDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    const normalized = parsedDate.toISOString().slice(0, 10);
    if (normalized !== values.date) return { error: "Please provide a valid event date." };
    if (values.date <= new Date().toISOString().slice(0, 10)) {
      return { error: "Event date must be in the future." };
    }
  } else {
    parsedDate = new Date(values.date);
    if (Number.isNaN(parsedDate.getTime())) return { error: "Please provide a valid event date." };
    if (parsedDate.getTime() <= Date.now()) return { error: "Event date must be in the future." };
  }

  try {
    const imageUrl = new URL(values.image);
    if (!new Set(["http:", "https:"]).has(imageUrl.protocol)) {
      return { error: "Thumbnail must be a valid HTTP or HTTPS URL." };
    }
  } catch {
    return { error: "Thumbnail must be a valid image URL." };
  }

  if (values.title.length > 120 || values.location.length > 180 || values.description.length > 5000) {
    return { error: "Title, location, or description exceeds the allowed length." };
  }

  return { values };
}

function isFutureEvent(event) {
  if (!event?.date) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
    return event.date > new Date().toISOString().slice(0, 10);
  }
  const date = new Date(event.date);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function serializeEvent(event) {
  return { ...event, _id: event._id?.toString() };
}

export async function getAllEvents(_req, res) {
  try {
    const db = await getDB();
    const now = new Date();
    const events = await db.collection("events")
      .find({ $expr: { $gt: [{ $convert: { input: "$date", to: "date", onError: null, onNull: null } }, now] } })
      .sort({ date: 1, createdAt: -1 })
      .toArray();

    return res.status(200).json({ success: true, events: events.map(serializeEvent) });
  } catch (error) {
    console.error("Get upcoming events failed:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch upcoming events." });
  }
}

export async function getFeaturedEvents(_req, res) {
  try {
    const db = await getDB();
    const now = new Date();
    const events = await db.collection("events")
      .find({ $expr: { $gt: [{ $convert: { input: "$date", to: "date", onError: null, onNull: null } }, now] } })
      .sort({ date: 1 })
      .limit(6)
      .toArray();

    return res.status(200).json({ success: true, events: events.map(serializeEvent) });
  } catch (error) {
    console.error("Get featured events failed:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch featured events." });
  }
}

export async function getEventById(req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid event ID." });
  }

  try {
    const db = await getDB();
    const event = await db.collection("events").findOne({ _id: new ObjectId(req.params.id) });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });
    return res.status(200).json({ success: true, event: serializeEvent(event) });
  } catch (error) {
    console.error("Get event details failed:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch event details." });
  }
}

export async function createEvent(req, res) {
  const validation = validateEventInput(req.body);
  if (validation.error) return res.status(400).json({ success: false, message: validation.error });

  try {
    const db = await getDB();
    const user = await db.collection("users").findOne({ email: req.user.email }, { projection: { password: 0 } });
    if (!user) return res.status(401).json({ success: false, message: "User account was not found. Please log in again." });

    const newEvent = {
      ...validation.values,
      organizer: user.name,
      organizerAvatar: user.photoURL || "",
      organizerEmail: user.email,
      creatorEmail: user.email,
      time: "09:00 AM - 01:00 PM",
      attendeesCount: 0,
      status: "published",
      createdAt: new Date(),
    };
    const result = await db.collection("events").insertOne(newEvent);

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      event: serializeEvent({ ...newEvent, _id: result.insertedId }),
    });
  } catch (error) {
    console.error("Create event failed:", error);
    return res.status(500).json({ success: false, message: "Failed to create event." });
  }
}

export async function updateEvent(req, res) {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid event ID." });
  const validation = validateEventInput(req.body);
  if (validation.error) return res.status(400).json({ success: false, message: validation.error });

  try {
    const db = await getDB();
    const eventId = new ObjectId(req.params.id);
    const existing = await db.collection("events").findOne({ _id: eventId });
    if (!existing) return res.status(404).json({ success: false, message: "Event not found." });
    if (existing.organizerEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: "You can only update events that you created." });
    }

    await db.collection("events").updateOne(
      { _id: eventId, organizerEmail: req.user.email },
      { $set: { ...validation.values, updatedAt: new Date() } }
    );
    const updatedEvent = await db.collection("events").findOne({ _id: eventId });
    return res.status(200).json({ success: true, message: "Event updated successfully.", event: serializeEvent(updatedEvent) });
  } catch (error) {
    console.error("Update event failed:", error);
    return res.status(500).json({ success: false, message: "Failed to update event." });
  }
}

export async function deleteEvent(req, res) {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid event ID." });

  try {
    const db = await getDB();
    const eventId = new ObjectId(req.params.id);
    const existing = await db.collection("events").findOne({ _id: eventId });
    if (!existing) return res.status(404).json({ success: false, message: "Event not found." });
    if (existing.organizerEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: "You can only delete events that you created." });
    }

    await db.collection("eventParticipants").deleteMany({ eventId });
    await db.collection("events").deleteOne({ _id: eventId, organizerEmail: req.user.email });
    return res.status(200).json({ success: true, message: "Event deleted successfully." });
  } catch (error) {
    console.error("Delete event failed:", error);
    return res.status(500).json({ success: false, message: "Failed to delete event." });
  }
}

export async function joinEvent(req, res) {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid event ID." });

  try {
    const db = await getDB();
    const eventId = new ObjectId(req.params.id);
    const [event, user] = await Promise.all([
      db.collection("events").findOne({ _id: eventId }),
      db.collection("users").findOne({ email: req.user.email }, { projection: { password: 0 } }),
    ]);
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });
    if (!isFutureEvent(event)) return res.status(400).json({ success: false, message: "You cannot join an event that is no longer upcoming." });
    if (!user) return res.status(401).json({ success: false, message: "User account was not found. Please log in again." });

    try {
      await db.collection("eventParticipants").insertOne({
        eventId,
        userEmail: user.email,
        user: { name: user.name, email: user.email, photoURL: user.photoURL || "" },
        event: {
          title: event.title,
          category: event.category,
          date: event.date,
          location: event.location,
          image: event.image,
          description: event.description,
          organizerEmail: event.organizerEmail,
        },
        joinedAt: new Date(),
      });
    } catch (error) {
      if (error?.code === 11000) return res.status(409).json({ success: false, message: "You have already joined this event." });
      throw error;
    }

    await db.collection("events").updateOne({ _id: eventId }, { $inc: { attendeesCount: 1 } });
    return res.status(201).json({ success: true, message: "You joined the event successfully." });
  } catch (error) {
    console.error("Join event failed:", error);
    return res.status(500).json({ success: false, message: "Failed to join event." });
  }
}

export async function cancelEventParticipation(req, res) {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid event ID." });

  try {
    const db = await getDB();
    const eventId = new ObjectId(req.params.id);
    const result = await db.collection("eventParticipants").deleteOne({ eventId, userEmail: req.user.email });
    if (!result.deletedCount) return res.status(404).json({ success: false, message: "You have not joined this event." });
    await db.collection("events").updateOne({ _id: eventId, attendeesCount: { $gt: 0 } }, { $inc: { attendeesCount: -1 } });
    return res.status(200).json({ success: true, message: "Event participation cancelled." });
  } catch (error) {
    console.error("Cancel participation failed:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel event participation." });
  }
}

export async function getMyEvents(req, res) {
  try {
    const db = await getDB();
    const events = await db.collection("events")
      .find({ organizerEmail: req.user.email })
      .sort({ date: 1, createdAt: -1 })
      .toArray();
    return res.status(200).json({ success: true, total: events.length, events: events.map(serializeEvent) });
  } catch (error) {
    console.error("Get my events failed:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch your events." });
  }
}

export async function getMyJoinedEvents(req, res) {
  try {
    const db = await getDB();
    const participations = await db.collection("eventParticipants")
      .find({ userEmail: req.user.email })
      .toArray();
    const eventIds = participations.map((item) => item.eventId);
    const events = await db.collection("events")
      .find({ _id: { $in: eventIds } })
      .sort({ date: 1 })
      .toArray();
    return res.status(200).json({ success: true, total: events.length, events: events.map(serializeEvent) });
  } catch (error) {
    console.error("Get joined events failed:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch joined events." });
  }
}
