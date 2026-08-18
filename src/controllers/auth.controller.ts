import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository.js";
import { otpRepository } from "../repositories/otp.repository.js";
import { sessionRepository } from "../repositories/session.repository.js";
import { otpService } from "../services/otp.service.js";
import { jwtService } from "../services/jwt.service.js";
import { emailService } from "../services/email.service.js";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  resendOtpSchema,
} from "../validators/auth.schema.js";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../utils/errors.js";
import mongoose from "mongoose";
import Order from "../models/order.model.js";
import ReturnRequest from "../models/returnRequest.model.js";

const COOKIE_NAME = "refreshToken";
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: OAuth - Support Google Login, Apple Login, and other Social Login providers
      const { name, email, password } = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw new BadRequestError("EMAIL IS ALREADY REGISTERED");
      }

      // Hash password using bcrypt
      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      // Create inactive user
      await userRepository.create({
        name,
        email,
        passwordHash,
        role: "customer",
        isVerified: false,
      });

      // Generate & hash registration OTP
      const rawOtp = await otpService.createAndSaveOtp(email, "register");

      // Send OTP via Resend
      await emailService.sendRegistrationOtpEmail(email, rawOtp);

      res.status(201).json({
        success: true,
        message: "REGISTRATION SUCCESSFUL. VERIFICATION OTP SENT.",
        data: null,
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Verify registration OTP and activate account
   * POST /api/auth/verify-registration-otp
   */
  async verifyRegistrationOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = verifyOtpSchema.parse(req.body);

      // Verify and invalidate OTP immediately
      const isValid = await otpService.verifyOtp(email, otp, "register");
      if (!isValid) {
        throw new BadRequestError("INVALID VERIFICATION CODE");
      }

      // Find user
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError("USER NOT FOUND");
      }

      // Activate user
      user.isVerified = true;
      await user.save();

      // Issue JWTs
      const payload = {
        userId: String(user._id),
        email: user.email,
        role: user.role,
      };

      const accessToken = jwtService.generateAccessToken(payload);
      const refreshToken = jwtService.generateRefreshToken(payload);

      // Save session
      const refreshTokenHash = jwtService.hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await sessionRepository.createSession({
        userId: user._id as mongoose.Types.ObjectId,
        refreshTokenHash,
        device: req.headers["sec-ch-ua"] as string || "Web Browser",
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"],
        expiresAt,
      });

      // Send welcome email
      await emailService.sendWelcomeEmail(user.email, user.name);

      // Set cookie
      res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

      res.status(200).json({
        success: true,
        message: "ACCOUNT VERIFIED AND LOGGED IN",
        data: {
          accessToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
          },
        },
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Login user step 1: Validate credentials and send OTP
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: OAuth - Support Google Login, Apple Login, and other Social Login providers
      const { email, password } = loginSchema.parse(req.body);

      const user = await userRepository.findByEmail(email);
      // Prevent user enumeration by checking password matching even if user is missing
      let isMatch = false;
      if (user) {
        isMatch = await bcrypt.compare(password, user.passwordHash);
      } else {
        // Fake compare to prevent timing attacks
        await bcrypt.compare(password, "$2a$12$LRYtq.gA5X8r/v.678hZye3rX9Y3rX9Y3rX9Y3rX9Y3rX9Y3rX9Y.");
      }

      if (!user || !isMatch) {
        throw new UnauthorizedError("INVALID EMAIL OR PASSWORD");
      }

      // Generate & hash login OTP
      const rawOtp = await otpService.createAndSaveOtp(email, "login");

      // Send OTP via Resend
      await emailService.sendLoginOtpEmail(email, rawOtp);

      res.status(200).json({
        success: true,
        message: "CREDENTIALS VERIFIED. LOGIN OTP SENT.",
        data: null,
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Login user step 2: Verify OTP and issue tokens
   * POST /api/auth/verify-login-otp
   */
  async verifyLoginOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = verifyOtpSchema.parse(req.body);

      // Verify and invalidate OTP immediately
      const isValid = await otpService.verifyOtp(email, otp, "login");
      if (!isValid) {
        throw new BadRequestError("INVALID VERIFICATION CODE");
      }

      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError("USER NOT FOUND");
      }

      // Issue JWTs
      const payload = {
        userId: String(user._id),
        email: user.email,
        role: user.role,
      };

      const accessToken = jwtService.generateAccessToken(payload);
      const refreshToken = jwtService.generateRefreshToken(payload);

      // Save session
      const refreshTokenHash = jwtService.hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await sessionRepository.createSession({
        userId: user._id as mongoose.Types.ObjectId,
        refreshTokenHash,
        device: req.headers["sec-ch-ua"] as string || "Web Browser",
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"],
        expiresAt,
      });

      // Set cookie
      res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

      res.status(200).json({
        success: true,
        message: "LOGIN SUCCESSFUL",
        data: {
          accessToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
          },
        },
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Resend OTP code
   * POST /api/auth/resend-otp
   */
  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, purpose } = resendOtpSchema.parse(req.body);

      // Prevent user enumeration for password resets
      const user = await userRepository.findByEmail(email);
      if (purpose !== "register" && !user) {
        // Return generic success to avoid enumeration
        return res.status(200).json({
          success: true,
          message: "VERIFICATION OTP RESENT SUCCESSFULLY",
          data: null,
          error: null,
        });
      }

      // Resend OTP checking thresholds
      const rawOtp = await otpService.resendOtp(email, purpose);

      // Dispatch mail based on purpose
      if (purpose === "register") {
        await emailService.sendRegistrationOtpEmail(email, rawOtp);
      } else if (purpose === "login") {
        await emailService.sendLoginOtpEmail(email, rawOtp);
      } else if (purpose === "password_reset") {
        await emailService.sendPasswordResetOtpEmail(email, rawOtp);
      }

      res.status(200).json({
        success: true,
        message: "VERIFICATION OTP RESENT SUCCESSFULLY",
        data: null,
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Forgot password request: send reset OTP
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      const user = await userRepository.findByEmail(email);
      if (user) {
        const rawOtp = await otpService.createAndSaveOtp(email, "password_reset");
        await emailService.sendPasswordResetOtpEmail(email, rawOtp);
      }

      // Return generic message to prevent user enumeration
      res.status(200).json({
        success: true,
        message: "IF THE EMAIL IS REGISTERED, A PASSWORD RECOVERY CODE HAS BEEN SENT.",
        data: null,
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Verify forgot password reset OTP (does not delete yet, just checks correctness)
   * POST /api/auth/verify-reset-otp
   */
  async verifyResetOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = verifyOtpSchema.parse(req.body);

      const record = await otpRepository.findActiveOtp(email, "password_reset");
      if (!record) {
        throw new BadRequestError("VERIFICATION CODE EXPIRED OR INVALID");
      }

      if (record.attempts >= 5) {
        await otpRepository.deleteOtp(String(record._id));
        throw new BadRequestError("MAXIMUM VERIFICATION ATTEMPTS EXCEEDED. REQUEST A NEW CODE.");
      }

      const inputHash = otpService.hashOtp(otp);
      if (record.otpHash !== inputHash) {
        await otpRepository.incrementAttempts(String(record._id));
        throw new BadRequestError("INVALID VERIFICATION CODE");
      }

      res.status(200).json({
        success: true,
        message: "OTP VERIFIED SUCCESSFULLY. YOU CAN NOW RESET YOUR PASSWORD.",
        data: null,
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Reset user password
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);

      // Verify and delete OTP code
      const isValid = await otpService.verifyOtp(email, otp, "password_reset");
      if (!isValid) {
        throw new BadRequestError("INVALID OR EXPIRED VERIFICATION CODE");
      }

      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError("USER NOT FOUND");
      }

      // Update password hash
      const newHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      user.passwordHash = newHash;
      await user.save();

      res.status(200).json({
        success: true,
        message: "PASSWORD RESET SUCCESSFUL",
        data: null,
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Refreshes access tokens using cookies
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies[COOKIE_NAME];
      if (!refreshToken) {
        throw new UnauthorizedError("REFRESH TOKEN IS MISSING");
      }

      const decoded = jwtService.verifyRefreshToken(refreshToken);

      const tokenHash = jwtService.hashToken(refreshToken);
      const session = await sessionRepository.findSessionByHash(tokenHash);
      if (!session) {
        throw new UnauthorizedError("ACTIVE SESSION EXPIRED OR REVOKED");
      }

      const accessToken = jwtService.generateAccessToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });

      res.status(200).json({
        success: true,
        message: "ACCESS TOKEN REFRESHED",
        data: { accessToken },
        error: null,
      });
    } catch (e: any) {
      next(new UnauthorizedError("INVALID OR EXPIRED REFRESH SESSION"));
    }
  }

  /**
   * Terminate User Session and purge cookies
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies[COOKIE_NAME];
      if (refreshToken) {
        const tokenHash = jwtService.hashToken(refreshToken);
        await sessionRepository.deleteSessionByHash(tokenHash);
      }

      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
      });

      res.status(200).json({
        success: true,
        message: "LOGGED OUT SUCCESSFULLY",
        data: null,
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Returns current authenticated user metadata context
   * GET /api/auth/me
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("AUTHENTICATION IS REQUIRED");
      }

      const user = await userRepository.findById(req.user.userId);
      if (!user) {
        throw new BadRequestError("AUTHENTICATED USER DOES NOT EXIST");
      }

      res.status(200).json({
        success: true,
        message: "USER PROFILE RETRIEVED",
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            phone: user.phone,
            addresses: user.addresses,
            wishlist: user.wishlist,
            cart: user.cart,
          },
        },
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Admin Login Step 1: Validate/Create superadmin credentials and send OTP
   * POST /api/auth/admin-login
   */
  async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      let user = await userRepository.findByEmail(email);

      if (!user) {
        // Automatically create a new user as superadmin
        const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        user = await userRepository.create({
          name: "Super Admin",
          email,
          passwordHash,
          role: "superadmin",
          isVerified: true,
        });
      } else {
        // Validate password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          throw new UnauthorizedError("INVALID EMAIL OR PASSWORD");
        }
        // Ensure role is admin or superadmin
        if (user.role !== "admin" && user.role !== "superadmin") {
          user.role = "superadmin";
          await user.save();
        }
      }

      // Generate & hash login OTP
      const rawOtp = await otpService.createAndSaveOtp(email, "login");

      // Send OTP via Resend
      await emailService.sendLoginOtpEmail(email, rawOtp);

      res.status(200).json({
        success: true,
        message: "ADMIN CREDENTIALS VERIFIED. 2FA OTP SENT.",
        data: null,
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Admin Login Step 2: Verify OTP and issue tokens
   * POST /api/auth/admin-verify-otp
   */
  async verifyAdminOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = verifyOtpSchema.parse(req.body);

      // Verify and invalidate OTP immediately
      const isValid = await otpService.verifyOtp(email, otp, "login");
      if (!isValid) {
        throw new BadRequestError("INVALID VERIFICATION CODE");
      }

      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError("USER NOT FOUND");
      }

      // Issue JWTs
      const payload = {
        userId: String(user._id),
        email: user.email,
        role: user.role,
      };

      const accessToken = jwtService.generateAccessToken(payload);
      const refreshToken = jwtService.generateRefreshToken(payload);

      // Save session
      const refreshTokenHash = jwtService.hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await sessionRepository.createSession({
        userId: user._id as mongoose.Types.ObjectId,
        refreshTokenHash,
        device: (req.headers["sec-ch-ua"] as string) || "Web Browser",
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"],
        expiresAt,
      });

      // Set cookie
      res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

      res.status(200).json({
        success: true,
        message: "ADMIN LOGIN SUCCESSFUL",
        data: {
          accessToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
          },
        },
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Change user password (authenticated)
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("AUTHENTICATION IS REQUIRED");
      }

      const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

      const user = await userRepository.findById(req.user.userId);
      if (!user) {
        throw new NotFoundError("USER NOT FOUND");
      }

      // Check old password
      const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestError("INVALID CURRENT PASSWORD");
      }

      // Hash and update new password
      const newHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      user.passwordHash = newHash;
      await user.save();

      // TODO: Device Management - Revoke other sessions on password change
      // TODO: Multi-factor Authentication Apps - Require authenticator validation on critical actions

      res.status(200).json({
        success: true,
        message: "PASSWORD CHANGED SUCCESSFULLY",
        data: null,
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Update customer profile details (name, phone, avatar)
   * PATCH /api/auth/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("AUTHENTICATION IS REQUIRED");
      }

      const { name, phone, avatar } = req.body;
      const user = await userRepository.findById(req.user.userId);
      if (!user) {
        throw new NotFoundError("USER NOT FOUND");
      }

      if (name !== undefined) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (avatar !== undefined) user.avatar = avatar;

      await user.save();

      res.status(200).json({
        success: true,
        message: "PROFILE UPDATED SUCCESSFULLY",
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            phone: user.phone,
            addresses: user.addresses,
            wishlist: user.wishlist,
            cart: user.cart,
          },
        },
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Get authenticated customer summary statistics
   * GET /api/auth/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("AUTHENTICATION IS REQUIRED");
      }

      const userId = req.user.userId;
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("USER NOT FOUND");
      }

      // Count orders and total spent
      const userOrders = await Order.find({ userId, status: { $ne: "cancelled" } });
      const totalOrders = await Order.countDocuments({ userId });
      const totalSpent = userOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);

      // Count active return requests
      const activeReturns = await ReturnRequest.countDocuments({
        userId,
        status: { $in: ["requested", "approved", "pickupScheduled", "pickedUp", "received"] },
      });

      const wishlistCount = Array.isArray(user.wishlist) ? user.wishlist.length : 0;

      res.status(200).json({
        success: true,
        message: "USER STATISTICS RETRIEVED",
        data: {
          totalOrders,
          totalSpent,
          activeReturns,
          wishlistItems: wishlistCount,
        },
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }

  /**
   * Permanently delete customer user account
   * DELETE /api/auth/me
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("AUTHENTICATION IS REQUIRED");
      }

      const userId = req.user.userId;
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("USER NOT FOUND");
      }

      // Remove user record
      await user.deleteOne();

      // Clear auth cookies
      res.clearCookie(COOKIE_NAME);

      res.status(200).json({
        success: true,
        message: "ACCOUNT DELETED PERMANENTLY",
        data: null,
        error: null,
      });
    } catch (e: any) {
      next(e);
    }
  }
}

export const authController = new AuthController();
export default authController;

