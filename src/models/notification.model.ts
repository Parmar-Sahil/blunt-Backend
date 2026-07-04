import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  notificationId: string;
  userId?: mongoose.Types.ObjectId | string | null;
  type: string; // welcome, otp, order_confirmation, etc.
  channel: "email" | "sms" | "whatsapp" | "push" | "slack" | "discord";
  status: "queued" | "sending" | "sent" | "failed";
  recipient: string; // email address or phone number
  subject?: string | null;
  provider: string; // resend, twilio, etc.
  providerMessageId?: string | null;
  sentAt?: Date | null;
  failedAt?: Date | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    type: { type: String, required: true, index: true },
    channel: {
      type: String,
      enum: ["email", "sms", "whatsapp", "push", "slack", "discord"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "sending", "sent", "failed"],
      default: "queued",
      index: true,
    },
    recipient: { type: String, required: true, index: true },
    subject: { type: String, default: null },
    provider: { type: String, required: true },
    providerMessageId: { type: String, default: null },
    sentAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
export default Notification;
