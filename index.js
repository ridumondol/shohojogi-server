import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import eventRoutes from "./routes/eventRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();
const PORT = Number(process.env.PORT || 8000);
const configuredOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(configuredOrigins);

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://127.0.0.1:3000");
}

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by CORS."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.get("/", (_req, res) => {
  res.json({ success: true, message: "Shohojogi API is running." });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});

app.use((error, _req, res, _next) => {
  if (error?.message === "Origin is not allowed by CORS.") {
    res.status(403).json({ success: false, message: error.message });
    return;
  }

  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ success: false, message: "Request body must be valid JSON." });
    return;
  }

  console.error("Unhandled API error:", error);
  res.status(500).json({ success: false, message: "Internal server error." });
});

export { app };

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.info(`Shohojogi API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exitCode = 1;
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
