import AdminModel, { IAdmin } from "../models/admin.model.js";
import UserModel from "../models/user.model.js";
import AdminSessionModel, { IAdminSession } from "../models/admin-session.model.js";
import AuditLogModel, { IAuditLog } from "../models/audit-log.model.js";
import mongoose from "mongoose";

export class AdminRepository {
  // --- Admin operations ---
  async findByEmail(email: string): Promise<IAdmin | null> {
    const admin = await AdminModel.findOne({ email });
    if (admin) return admin;

    // Check user model as fallback for existing admin records
    const user = await UserModel.findOne({ email });
    if (user && (user.role === "superadmin" || user.role === "admin")) {
      // Auto-migrate to decoupled admins collection
      const migrated = new AdminModel({
        _id: user._id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role as "superadmin" | "admin",
        permissions: ["*"],
        isActive: true,
        isVerified: true,
        phone: user.phone || "",
        avatar: user.avatar || "",
        createdBy: "system",
      });
      await migrated.save();
      return migrated;
    }
    return null;
  }

  async findById(id: string): Promise<IAdmin | null> {
    const admin = await AdminModel.findById(id);
    if (admin) return admin;

    // Check user model as fallback
    const user = await UserModel.findById(id);
    if (user && (user.role === "superadmin" || user.role === "admin")) {
      // Auto-migrate to decoupled admins collection
      const migrated = new AdminModel({
        _id: user._id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role as "superadmin" | "admin",
        permissions: ["*"],
        isActive: true,
        isVerified: true,
        phone: user.phone || "",
        avatar: user.avatar || "",
        createdBy: "system",
      });
      await migrated.save();
      return migrated;
    }
    return null;
  }

  async findAll(query: any = {}): Promise<IAdmin[]> {
    return AdminModel.find(query).sort({ createdAt: -1 });
  }

  async create(adminData: Partial<IAdmin>): Promise<IAdmin> {
    const admin = new AdminModel(adminData);
    return admin.save();
  }

  async update(id: string, updateData: Partial<IAdmin>): Promise<IAdmin | null> {
    return AdminModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<IAdmin | null> {
    return AdminModel.findByIdAndDelete(id);
  }

  async count(query: any = {}): Promise<number> {
    return AdminModel.countDocuments(query);
  }

  // --- Session operations ---
  async createSession(sessionData: Partial<IAdminSession>): Promise<IAdminSession> {
    const session = new AdminSessionModel(sessionData);
    return session.save();
  }

  async findSessionByHash(refreshTokenHash: string): Promise<IAdminSession | null> {
    return AdminSessionModel.findOne({ refreshTokenHash });
  }

  async deleteSessionByHash(refreshTokenHash: string): Promise<any> {
    return AdminSessionModel.deleteOne({ refreshTokenHash });
  }

  async deleteAllSessionsForAdmin(adminId: string): Promise<any> {
    return AdminSessionModel.deleteMany({ adminId: new mongoose.Types.ObjectId(adminId) });
  }

  // --- Audit Log operations ---
  async createAuditLog(logData: Partial<IAuditLog>): Promise<IAuditLog> {
    const log = new AuditLogModel(logData);
    return log.save();
  }

  async getAuditLogs(query: any = {}, limit: number = 100): Promise<IAuditLog[]> {
    return AuditLogModel.find(query).sort({ createdAt: -1 }).limit(limit);
  }
}

export const adminRepository = new AdminRepository();
export default adminRepository;
