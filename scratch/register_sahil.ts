import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "../src/models/user.model.js";
import AdminModel from "../src/models/admin.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/blunt";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB.");

  const email = "sahilparmar7033030@gmail.com";
  const password = "Sahil@31";
  const name = "Sahil Parmar";

  const passwordHash = await bcrypt.hash(password, 12);

  // Delete existing
  await UserModel.deleteMany({ email });
  await AdminModel.deleteMany({ email });
  console.log("Deleted existing admins/users for: " + email);

  // Insert in users
  const user = new UserModel({
    name,
    email,
    passwordHash,
    role: "superadmin",
    isVerified: true,
  });
  await user.save();
  console.log("Created user in users collection.");

  // Insert in admins
  const admin = new AdminModel({
    name,
    email,
    passwordHash,
    role: "superadmin",
    permissions: ["*"],
    isActive: true,
    isVerified: true,
    phone: "",
    avatar: "",
    createdBy: "system",
  });
  await admin.save();
  console.log("Created admin in admins collection.");

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch(console.error);
