import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const RETRY_DELAY_MS = 5000;

// Atlas connections here drop/timeout often enough (ETIMEDOUT to the shard
// hosts) that a single failed attempt must never propagate as a rejection —
// the caller in app.js does `connectDB().then(...)` with no `.catch()`, so
// an unhandled rejection there takes down the whole process. Retrying in a
// loop keeps a transient network blip from turning into a full server crash.
export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set");

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Disconnected — attempting to reconnect...");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] Reconnected.");
  });

  for (;;) {
    try {
      await mongoose.connect(uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      console.log("MongoDB connected");
      return;
    } catch (err) {
      console.error(
        `[MongoDB] Connection attempt failed (${err.message}) — retrying in ${RETRY_DELAY_MS / 1000}s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}
