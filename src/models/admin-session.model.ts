import mongoose, { Schema, Document } from "mongoose";

export interface IAdminSession extends Document {
  adminId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  device: string;
  ipAddress: string;
  expiresAt: Date;
  createdAt: Date;
}

const AdminSessionSchema = new Schema<IAdminSession>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    refreshTokenHash: { type: String, required: true, unique: true, index: true },
    device: { type: String, required: true },
    ipAddress: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AdminSessionModel =
  mongoose.models.AdminSession || mongoose.model<IAdminSession>("AdminSession", AdminSessionSchema);
export default AdminSessionModel;
