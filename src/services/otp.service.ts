import crypto from "crypto";
import { otpRepository } from "../repositories/otp.repository.js";

export class OtpService {
  /**
   * Generates a secure random 6 digit numeric code
   */
  generateOtp(): string {
    const val = crypto.randomInt(100000, 999999);
    return val.toString();
  }

  /**
   * Hashes the raw code using SHA-256
   */
  hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  /**
   * Creates an OTP code record in MongoDB (valid for 5 minutes)
   */
  async createAndSaveOtp(
    email: string,
    purpose: "register" | "login" | "password_reset"
  ): Promise<string> {
    const rawOtp = this.generateOtp();
    const hash = this.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    await otpRepository.createOtp(email, hash, purpose, expiresAt);
    return rawOtp;
  }

  /**
   * Resends an OTP verification code, checking resend thresholds
   */
  async resendOtp(
    email: string,
    purpose: "register" | "login" | "password_reset"
  ): Promise<string> {
    const activeOtp = await otpRepository.findActiveOtp(email, purpose);
    
    if (activeOtp) {
      // Check maximum 3 resend limit within TTL window
      if (activeOtp.resendCount >= 3) {
        throw new Error("MAXIMUM RESEND ATTEMPTS EXCEEDED. PLEASE TRY LATER.");
      }
      
      // Increment count and renew expiration
      const rawOtp = this.generateOtp();
      const hash = this.hashOtp(rawOtp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins renewal
      
      activeOtp.otpHash = hash;
      activeOtp.expiresAt = expiresAt;
      activeOtp.resendCount += 1;
      activeOtp.attempts = 0; // Reset verification attempt counts on resend
      await activeOtp.save();
      
      return rawOtp;
    } else {
      // Fallback: Create fresh OTP if none active
      return this.createAndSaveOtp(email, purpose);
    }
  }

  /**
   * Validates OTP input, incrementing attempt counters and deleting on completion
   */
  async verifyOtp(
    email: string,
    inputOtp: string,
    purpose: "register" | "login" | "password_reset"
  ): Promise<boolean> {
    const record = await otpRepository.findActiveOtp(email, purpose);
    if (!record) {
      throw new Error("VERIFICATION CODE EXPIRED OR INVALID");
    }

    // Rate-limiting check: max 5 verification attempts
    if (record.attempts >= 5) {
      await otpRepository.deleteOtp(String(record._id));
      throw new Error("MAXIMUM VERIFICATION ATTEMPTS EXCEEDED. REQUEST A NEW CODE.");
    }

    const inputHash = this.hashOtp(inputOtp);
    if (record.otpHash !== inputHash) {
      await otpRepository.incrementAttempts(String(record._id));
      return false;
    }

    // Delete verified OTP record immediately on successful match
    await otpRepository.deleteOtp(String(record._id));
    return true;
  }
}

export const otpService = new OtpService();
export default otpService;
