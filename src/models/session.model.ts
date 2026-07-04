import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  device?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    device: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL Index (7 days)
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SessionModel = mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
export default SessionModel;
