import mongoose from "mongoose";
import dns from "dns";
import dbConfig from "../config/db.config.js";
import logger from "../utils/logger.js";

// Force public DNS resolvers to handle MongoDB Atlas querySrv DNS lookups correctly
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  logger.warn("[DNS] FAILED TO CONFIGURE PUBLIC DNS RESOLVERS", err);
}


import Category from "../models/category.model.js";
import Collection from "../models/collection.model.js";

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

const seedDefaultData = async () => {
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = ["Outerwear", "Hard Shell", "Soft Goods", "Hardware", "Accessories"];
      for (const name of defaultCategories) {
        await Category.create({
          name,
          slug: slugify(name),
          status: "active",
        });
      }
      logger.info("[DB] SEEDED DEFAULT CATEGORIES SUCCESSFULLY");
    }

    const collectionCount = await Collection.countDocuments();
    if (collectionCount === 0) {
      const defaultCollections = ["Winter '24", "Summer Apex", "Obsidian Core", "Pre-Release Drop"];
      for (const name of defaultCollections) {
        await Collection.create({
          name,
          slug: slugify(name),
          status: "active",
        });
      }
      logger.info("[DB] SEEDED DEFAULT COLLECTIONS SUCCESSFULLY");
    }
  } catch (err) {
    logger.error("[DB] SEEDING ERROR", err);
  }
};

export const connectDatabase = async (): Promise<void> => {
  mongoose.connection.on("connected", () => {
    logger.info("[DB] MONGODB CONNECTED");
    seedDefaultData();
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
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info("[DB] MONGODB CONNECTION CLOSED SUCCESSFULLY");
};
