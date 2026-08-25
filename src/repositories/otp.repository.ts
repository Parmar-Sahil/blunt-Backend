import OtpModel, { IOtp } from "../models/otp.model.js";

export class OtpRepository {
  async findActiveOtp(email: string, purpose: "register" | "login" | "password_reset"): Promise<IOtp | null> {
    const normalized = email.trim().toLowerCase();
    return OtpModel.findOne({
      purpose,
      $or: [
        { email: normalized },
        { email: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      ],
    }).sort({ createdAt: -1 });
  }

  async createOtp(
    email: string,
    otpHash: string,
    purpose: "register" | "login" | "password_reset",
    expiresAt: Date
  ): Promise<IOtp> {
    const normalized = email.trim().toLowerCase();
    // Clear any existing codes for this email and purpose first
    await OtpModel.deleteMany({
      purpose,
      $or: [
        { email: normalized },
        { email: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      ],
    });

    const otp = new OtpModel({
      email: normalized,
      otpHash,
      purpose,
      expiresAt,
      attempts: 0,
      resendCount: 0,
    });
    return otp.save();
  }

  async incrementAttempts(id: string): Promise<IOtp | null> {
    return OtpModel.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true });
  }

  async incrementResendCount(id: string): Promise<IOtp | null> {
    return OtpModel.findByIdAndUpdate(id, { $inc: { resendCount: 1 } }, { new: true });
  }

  async deleteOtp(id: string): Promise<any> {
    return OtpModel.findByIdAndDelete(id);
  }

  async deleteByEmailAndPurpose(email: string, purpose: "register" | "login" | "password_reset"): Promise<any> {
    return OtpModel.deleteMany({ email, purpose });
  }
}

export const otpRepository = new OtpRepository();
export default otpRepository;
