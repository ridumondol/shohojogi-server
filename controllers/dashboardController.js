
import { getDB } from "../config/db.js";

// GET DASHBOARD STATISTICS
export async function getDashboardStats(req, res) {
  try {
    const db = await getDB();

    const eventsCollection = db.collection("events");
    const usersCollection = db.collection("users");
    const participantsCollection = db.collection("eventParticipants");

    const totalEvents = await eventsCollection.countDocuments();
    const totalUsers = await usersCollection.countDocuments();
    const totalParticipants = await participantsCollection.countDocuments();

    const today = new Date().toISOString().split("T")[0];

    const upcomingEvents = await eventsCollection.countDocuments({
      date: { $gte: today },
    });

    // PERSONAL IMPACT
    const userEmail = req.user.email;

    const eventsCreated = await eventsCollection.countDocuments({
      organizerEmail: userEmail,
    });

    const joinedParticipations = await participantsCollection
      .find({ userEmail })
      .toArray();

    const eventsJoined = joinedParticipations.length;

    const joinedEventIds = joinedParticipations.map(
      (item) => item.eventId
    );

    const completedEvents = await eventsCollection.countDocuments({
      _id: { $in: joinedEventIds },
      date: { $lt: today },
    });

    const myEventIds = await eventsCollection
      .find({ organizerEmail: userEmail })
      .project({ _id: 1 })
      .toArray();

    const myEventObjectIds = myEventIds.map((event) => event._id);

    const myTotalParticipants = await participantsCollection.countDocuments({
      eventId: { $in: myEventObjectIds },
    });

    res.json({
      success: true,
      stats: {
        totalEvents,
        totalUsers,
        totalParticipants,
        upcomingEvents,
        eventsCreated,
        eventsJoined,
        completedEvents,
        myTotalParticipants,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics.",
    });
  }
}
