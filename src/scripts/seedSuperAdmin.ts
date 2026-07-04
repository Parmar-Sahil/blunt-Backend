import dotenv from "dotenv";
import { connectDatabase, disconnectDatabase } from "../utils/database.js";
import { adminService } from "../services/admin.service.js";

// Load configuration
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/blunt";
const NAME = process.env.SUPER_ADMIN_NAME;
const EMAIL = process.env.SUPER_ADMIN_EMAIL;
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

async function seed() {
  try {
    // 1. Inputs Verification
    if (!NAME || !EMAIL || !PASSWORD) {
      throw new Error("SEEDING ABORTED: Missing required environment variables (SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)");
    }

    // Assert complexity validations
    adminService.validateEmail(EMAIL);
    adminService.validatePassword(PASSWORD);

    // 2. Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await connectDatabase(MONGODB_URI);

    // 3. Check for existing Super Admin
    console.log("Checking existing Super Admin...");
    const exists = await adminService.checkSuperAdminExists();
    if (exists) {
      console.log("Super Admin already exists.");
      await disconnectDatabase();
      process.exit(0);
    }

    // 4. Create Super Admin
    console.log("Creating Super Admin...");
    const admin = await adminService.createSuperAdmin({
      name: NAME,
      email: EMAIL,
      passwordPlain: PASSWORD,
    });

    console.log("Super Admin created successfully.");
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Created At: ${admin.createdAt}`);

    await disconnectDatabase();
    process.exit(0);
  } catch (err: any) {
    if (process.env.NODE_ENV === "production") {
      console.error("[SEED ERROR] SEEDING PROCESS FAILED:", err.message);
    } else {
      console.error("[SEED ERROR] SEEDING PROCESS FAILED:", err);
    }
    
    try {
      await disconnectDatabase();
    } catch {
      // ignore
    }
    process.exit(1);
  }
}

seed();
