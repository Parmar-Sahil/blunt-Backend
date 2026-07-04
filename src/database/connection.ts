import mongoose from "mongoose";
import dbConfig from "../config/db.config.js";
import logger from "../utils/logger.js";

export const connectDatabase = async (): Promise<void> => {
  mongoose.connection.on("connected", () => {
    logger.info("[DB] MONGODB CONNECTED");
  });

  mongoose.connection.on("error", (err) => {
    logger.error("[DB] MONGODB CONNECTION ERROR", err);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("[DB] MONGODB DISCONNECTED. ATTEMPTING RECONNECT...");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("[DB] MONGODB RECONNECTED SUCCESSFULLY");
  });

  try {
    await mongoose.connect(dbConfig.uri, dbConfig.options);
  } catch (err: any) {
    logger.error("[DB] INITIAL MONGODB CONNECTION ATTEMPT FAILED", err.message);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info("[DB] MONGODB CONNECTION CLOSED SUCCESSFULLY");
};
