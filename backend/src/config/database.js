import mongoose from "mongoose";
import { env } from "./env.js";

// Reuse a single connection across hot reloads (tsx watch / nodemon).
if (!globalThis.__mongoose) {
  mongoose.set("strictQuery", true);
  globalThis.__mongoose = mongoose;
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    return mongoose.connection;
  }

  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== mongoose.ConnectionStates.disconnected) {
    await mongoose.disconnect();
  }
}
