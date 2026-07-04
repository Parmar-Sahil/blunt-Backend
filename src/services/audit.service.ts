import { Request } from "express";
import { adminRepository } from "../repositories/admin.repository.js";
import mongoose from "mongoose";

export class AuditService {
  /**
   * Automatically creates an audit log entry for administrative activity.
   */
  async logAction(
    adminId: string | mongoose.Types.ObjectId,
    action: string,
    entity: string,
    entityId: string,
    req?: Request
  ): Promise<void> {
    try {
      const ipAddress = req?.ip || "127.0.0.1";
      const userAgent = req?.headers["user-agent"] || "System Process";

      await adminRepository.createAuditLog({
        adminId: typeof adminId === "string" ? new mongoose.Types.ObjectId(adminId) : adminId,
        action,
        entity,
        entityId,
        ipAddress,
        userAgent,
      });

      console.log(`[AUDIT] Action: ${action} | Entity: ${entity} | AdminId: ${adminId}`);
    } catch (e: any) {
      console.error("[AUDIT ERROR] FAILED TO WRITE AUDIT LOG:", e.message);
    }
  }
}

export const auditService = new AuditService();
export default auditService;
