import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { adminRepository } from "../repositories/admin.repository.js";
import { otpService } from "../services/otp.service.js";
import { jwtService } from "../services/jwt.service.js";
import { emailService } from "../services/email.service.js";
import { auditService } from "../services/audit.service.js";
import { adminCreateSchema, adminUpdateSchema } from "../validators/admin.schema.js";
import { loginSchema, verifyOtpSchema } from "../validators/auth.schema.js";
import { z } from "zod";
import { BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError } from "../utils/errors.js";

const COOKIE_NAME = "adminRefreshToken";
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export class AdminController {
  /**
   * Admin Login Step 1: Validate credentials and send 2FA OTP
   * POST /api/admin/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const admin = await adminRepository.findByEmail(email);
      let isMatch = false;

      if (admin) {
        isMatch = await bcrypt.compare(password, admin.passwordHash);
      } else {
        // Prevent timing attacks
        await bcrypt.compare(password, "$2a$12$LRYtq.gA5X8r/v.678hZye3rX9Y3rX9Y3rX9Y3rX9Y3rX9Y3rX9Y.");
      }

      if (!admin || !isMatch) {
        const actorId = admin ? admin._id : new mongoose.Types.ObjectId("000000000000000000000000");
        await auditService.logAction(
          actorId,
          "ADMIN_LOGIN_DENIED",
          "Admin",
          email,
          req
        );
        throw new UnauthorizedError("INVALID EMAIL OR PASSWORD");
      }

      if (!admin.isActive) {
        await auditService.logAction(
          admin._id,
          "ADMIN_LOGIN_DENIED",
          "Admin",
          email,
          req
        );
        throw new ForbiddenError("ADMIN ACCOUNT IS CURRENTLY INACTIVE");
      }

      // Generate & hash login OTP in OTP database
      const rawOtp = await otpService.createAndSaveOtp(email, "login");

      // Send OTP via Resend
      await emailService.sendLoginOtpEmail(email, rawOtp);

      res.status(200).json({
        success: true,
        message: "ADMIN CREDENTIALS CONFIRMED. 2FA VERIFICATION CODE SENT.",
        data: null,
        error: null,
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Admin Login Step 2: Verify OTP and issue JWT tokens
   * POST /api/admin/verify-otp
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = verifyOtpSchema.parse(req.body);

      const admin = await adminRepository.findByEmail(email);

      // Verify OTP
      const isValid = await otpService.verifyOtp(email, otp, "login");
      if (!isValid) {
        const actorId = admin ? admin._id : new mongoose.Types.ObjectId("000000000000000000000000");
        await auditService.logAction(
          actorId,
          "ADMIN_LOGIN_DENIED",
          "Admin",
          email,
          req
        );
        throw new BadRequestError("INVALID OR EXPIRED VERIFICATION CODE");
      }

      if (!admin) {
        throw new NotFoundError("ADMIN ACCOUNT NOT FOUND");
      }

      if (!admin.isActive) {
        throw new ForbiddenError("ADMIN ACCOUNT IS INACTIVE");
      }

      // Issue JWTs
      const payload = {
        userId: String(admin._id),
        email: admin.email,
        role: admin.role,
      };

      const accessToken = jwtService.generateAccessToken(payload);
      const refreshToken = jwtService.generateRefreshToken(payload);

      // Save admin session
      const refreshTokenHash = jwtService.hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await adminRepository.createSession({
        adminId: admin._id as mongoose.Types.ObjectId,
        refreshTokenHash,
        device: (req.headers["sec-ch-ua"] as string) || "Web Browser",
        ipAddress: req.ip || "127.0.0.1",
        expiresAt,
      });

      // Update last login timestamp
      admin.lastLogin = new Date();
      await admin.save();

      // Log Login Action
      await auditService.logAction(admin._id, "LOGIN", "Admin", String(admin._id), req);

      // Set cookie
      res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

      res.status(200).json({
        success: true,
        message: "ADMINISTRATIVE PORTAL ACCESS VERIFIED",
        data: {
          accessToken,
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions || [],
            phone: admin.phone,
          },
        },
        error: null,
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Terminate admin session
   * POST /api/admin/logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies[COOKIE_NAME];
      if (refreshToken) {
        const hash = jwtService.hashToken(refreshToken);
        await adminRepository.deleteSessionByHash(hash);
      }

      if (req.admin) {
        await auditService.logAction(req.admin.id, "LOGOUT", "Admin", req.admin.id, req);
      }

      res.clearCookie(COOKIE_NAME, getCookieOptions());

      res.status(200).json({
        success: true,
        message: "ADMINISTRATIVE ACCESS TERMINATED",
        data: null,
        error: null,
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Refreshes administrative access tokens using cookies
   * POST /api/admin/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies[COOKIE_NAME];
      if (!refreshToken) {
        throw new UnauthorizedError("REFRESH TOKEN IS MISSING");
      }

      const decoded = jwtService.verifyRefreshToken(refreshToken);

      const tokenHash = jwtService.hashToken(refreshToken);
      const session = await adminRepository.findSessionByHash(tokenHash);
      if (!session) {
        throw new UnauthorizedError("ACTIVE SESSION EXPIRED OR REVOKED");
      }

      const admin = await adminRepository.findById(decoded.userId);
      if (!admin || !admin.isActive) {
        throw new ForbiddenError("ADMINISTRATIVE ACCESS DENIED");
      }

      const accessToken = jwtService.generateAccessToken({
        userId: String(admin._id),
        email: admin.email,
        role: admin.role,
      });

      res.status(200).json({
        success: true,
        message: "ADMIN ACCESS TOKEN REFRESHED",
        data: { accessToken },
        error: null,
      });
    } catch (e: any) {
      next(new UnauthorizedError("INVALID OR EXPIRED REFRESH SESSION"));
    }
  }

  /**
   * Retrieves active profile metadata
   * GET /api/admin/me
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.admin) {
        throw new UnauthorizedError("AUTHENTICATION IS REQUIRED");
      }

      const admin = await adminRepository.findById(req.admin.id);
      if (!admin) {
        throw new NotFoundError("ADMIN NOT FOUND");
      }

      res.status(200).json({
        success: true,
        message: "ADMIN PROFILE COMPLETED",
        data: {
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions || [],
            phone: admin.phone,
            avatar: admin.avatar,
          },
        },
        error: null,
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Retrieves all administrative profiles
   * GET /api/admins
   */
  async getAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      const admins = await adminRepository.findAll();
      res.status(200).json({
        success: true,
        message: "ADMINISTRATIVE ACCOUNTS RETRIEVED",
        data: admins.map((adm) => ({
          id: adm._id,
          name: adm.name,
          email: adm.email,
          role: adm.role,
          permissions: adm.permissions || [],
          phone: adm.phone,
          avatar: adm.avatar,
          isActive: adm.isActive,
          lastLogin: adm.lastLogin,
          createdAt: adm.createdAt,
        })),
        error: null,
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Register new admin account
   * POST /api/admins
   */
  async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role, permissions, phone } = adminCreateSchema.parse(req.body);

      const existing = await adminRepository.findByEmail(email);
      if (existing) {
        throw new BadRequestError("EMAIL IS ALREADY REGISTERED");
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      const newAdmin = await adminRepository.create({
        name,
        email,
        passwordHash,
        role,
        permissions,
        phone,
        isActive: true,
        createdBy: req.admin ? new mongoose.Types.ObjectId(req.admin.id) : undefined,
      });

      if (req.admin) {
        await auditService.logAction(req.admin.id, "ADMIN_CREATED", "Admin", String(newAdmin._id), req);
      }

      res.status(201).json({
        success: true,
        message: "NEW ADMINISTRATIVE ACCOUNT COMPLETED",
        data: {
          id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
        },
        error: null,
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Edit admin details
   * PUT /api/admins/:id
   */
  async updateAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = adminUpdateSchema.parse(req.body);

      const updated = await adminRepository.update(id, updateData);
      if (!updated) {
        throw new NotFoundError("ADMIN ACCOUNT NOT FOUND");
      }

      if (req.admin) {
        await auditService.logAction(req.admin.id, "ADMIN_UPDATED", "Admin", id, req);
      }

      res.status(200).json({
        success: true,
        message: "ADMINISTRATIVE ACCOUNT MODIFIED",
        data: updated,
        error: null,
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Remove admin account
   * DELETE /api/admins/:id
   */
  async deleteAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const deleted = await adminRepository.delete(id);
      if (!deleted) {
        throw new NotFoundError("ADMIN ACCOUNT NOT FOUND");
      }

      if (req.admin) {
        await auditService.logAction(req.admin.id, "ADMIN_DELETED", "Admin", id, req);
      }

      res.status(200).json({
        success: true,
        message: "ADMINISTRATIVE ACCOUNT RETIRED",
        data: null,
        error: null,
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Activate / Deactivate status toggle
   * PATCH /api/admins/:id/status
   */
  async updateAdminStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);

      const updated = await adminRepository.update(id, { isActive });
      if (!updated) {
        throw new NotFoundError("ADMIN ACCOUNT NOT FOUND");
      }

      if (req.admin) {
        const actionType = isActive ? "ADMIN_ACTIVATED" : "ADMIN_DEACTIVATED";
        await auditService.logAction(req.admin.id, actionType, "Admin", id, req);
      }

      res.status(200).json({
        success: true,
        message: `ADMIN STATUS UPDATED TO ${isActive ? "ACTIVE" : "INACTIVE"}`,
        data: updated,
        error: null,
      });
    } catch (e) {
      next(e);
    }
  }
}

export const adminController = new AdminController();
export default adminController;
