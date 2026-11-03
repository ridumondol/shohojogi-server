import { MongoClient } from "mongodb";
import "dotenv/config";

const databaseName = process.env.MONGODB_DB_NAME || "shohojogi";
let client;
let clientPromise;
let databasePromise;

export async function connectDB() {
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("Missing required environment variable: MONGODB_URL");

  if (!clientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
      serverSelectionTimeoutMS: 10000,
    });
    clientPromise = client.connect();
  }

  if (!databasePromise) {
    databasePromise = clientPromise.then(async (connectedClient) => {
      const database = connectedClient.db(databaseName);
      await Promise.all([
        database.collection("users").createIndex({ email: 1 }, { unique: true }),
        database.collection("eventParticipants").createIndex(
          { eventId: 1, userEmail: 1 },
          { unique: true }
        ),
        database.collection("events").createIndex({ date: 1 }),
        database.collection("events").createIndex({ organizerEmail: 1 }),
      ]);
      console.info(`MongoDB connected (database: ${databaseName})`);
      return database;
    }).catch(async (error) => {
      clientPromise = undefined;
      databasePromise = undefined;
      if (client) await client.close().catch(() => undefined);
      client = undefined;
      throw error;
    });
  }
  return databasePromise;
}

export function getDB() {
  if (!databasePromise) throw new Error("Database is not connected. Await connectDB() first.");
  return databasePromise;
}
