import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otpHash: string;
  purpose: "register" | "login" | "password_reset";
  expiresAt: Date;
  attempts: number;
  resendCount: number;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  email: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  purpose: { type: String, enum: ["register", "login", "password_reset"], required: true },
  attempts: { type: Number, required: true, default: 0 },
  resendCount: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL Index (5 minutes)
});

export const OtpModel = mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
export default OtpModel;
