import OtpModel, { IOtp } from "../models/otp.model.js";

export class OtpRepository {
  async findActiveOtp(email: string, purpose: "register" | "login" | "password_reset"): Promise<IOtp | null> {
    return OtpModel.findOne({ email, purpose }).sort({ createdAt: -1 });
  }

  async createOtp(
    email: string,
    otpHash: string,
    purpose: "register" | "login" | "password_reset",
    expiresAt: Date
  ): Promise<IOtp> {
    // Clear any existing codes for this email and purpose first
    await OtpModel.deleteMany({ email, purpose });
    
    const otp = new OtpModel({
      email,
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
