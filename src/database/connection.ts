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
import Product from "../models/product.model.js";

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

const BLUNT_PRODUCT_TYPES = [
  "Oversized T-Shirt",
  "Boxy T-Shirt",
  "Regular Fit T-Shirt",
  "Heavyweight T-Shirt",
  "Graphic T-Shirt",
  "Minimal T-Shirt",
  "Drop Shoulder T-Shirt",
  "Longline T-Shirt",
];

const BLUNT_COLLECTIONS = [
  "Essentials",
  "Obsidian",
  "Midnight Drop",
  "Core Collection",
  "New Era",
  "Archive",
  "Limited Drop",
];

const seedDefaultData = async () => {
  try {
    // 1. Ensure all BLUNT T-Shirt Product Types (Categories) exist
    for (const name of BLUNT_PRODUCT_TYPES) {
      const slug = slugify(name);
      const existing = await Category.findOne({ name });
      if (!existing) {
        await Category.create({
          name,
          slug,
          status: "active",
        });
        logger.info(`[DB] CREATED PRODUCT TYPE: ${name}`);
      }
    }

    // 2. Ensure all BLUNT Collections exist
    for (const name of BLUNT_COLLECTIONS) {
      const slug = slugify(name);
      const existing = await Collection.findOne({ name });
      if (!existing) {
        await Collection.create({
          name,
          slug,
          status: "active",
        });
        logger.info(`[DB] CREATED COLLECTION: ${name}`);
      }
    }

    // 3. Migration: Handle any legacy generic categories ("Outerwear", "Hard Shell", etc.)
    const defaultProductType = await Category.findOne({ name: "Oversized T-Shirt" });
    if (defaultProductType) {
      const legacyCategories = await Category.find({
        name: { $in: ["Outerwear", "Hard Shell", "Soft Goods", "Hardware", "Accessories"] },
      });

      for (const legacyCat of legacyCategories) {
        // Re-assign products referencing legacy category to default "Oversized T-Shirt"
        const updateResult = await Product.updateMany(
          { categoryId: legacyCat._id },
          { $set: { categoryId: defaultProductType._id } }
        );
        if (updateResult.modifiedCount > 0) {
          logger.info(
            `[DB] MIGRATED ${updateResult.modifiedCount} PRODUCTS FROM LEGACY CATEGORY '${legacyCat.name}' TO 'Oversized T-Shirt'`
          );
        }
        // Remove old generic category
        await Category.findByIdAndDelete(legacyCat._id);
        logger.info(`[DB] REMOVED LEGACY GENERIC CATEGORY '${legacyCat.name}'`);
      }
    }

    logger.info("[DB] BLUNT T-SHIRT TAXONOMY & DATA SYNC COMPLETED SUCCESSFULLY");
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
