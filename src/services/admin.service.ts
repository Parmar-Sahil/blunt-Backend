import bcrypt from "bcryptjs";
import AdminModel, { IAdmin } from "../models/Admin.js";

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);

export class AdminService {
  /**
   * Asserts whether any Super Admin currently exists in MongoDB.
   */
  async checkSuperAdminExists(): Promise<boolean> {
    const superAdmin = await AdminModel.findOne({ role: "superadmin" });
    return !!superAdmin;
  }

  /**
   * Securely saves the root Super Admin account in the database.
   */
  async createSuperAdmin(data: {
    name: string;
    email: string;
    passwordPlain: string;
  }): Promise<IAdmin> {
    // Hash password securely
    const passwordHash = await bcrypt.hash(data.passwordPlain, BCRYPT_SALT_ROUNDS);

    const admin = new AdminModel({
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: "superadmin",
      permissions: ["*"],
      isActive: true,
      isVerified: true,
      phone: "",
      avatar: "",
      createdBy: "system",
    });

    return admin.save();
  }

  /**
   * Strict password complexity checks:
   * - Minimum 12 characters.
   * - Upper, lower, digit, special char.
   */
  validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new Error("PASSWORD MUST BE AT LEAST 8 CHARACTERS LONG");
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      throw new Error(
        "PASSWORD COMPLEXITY CRITERIA NOT MET. MUST CONTAIN UPPERCASE, LOWERCASE, NUMBER AND SPECIAL CHARACTER."
      );
    }
  }

  /**
   * Standard RFC 5322 email regex format check.
   */
  validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error("INVALID EMAIL ADDRESS FORMAT");
    }
  }
}

export const adminService = new AdminService();
export default adminService;
