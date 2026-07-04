import { Request, Response, NextFunction } from "express";
import { jwtService } from "../services/jwt.service.js";
import { adminRepository } from "../repositories/admin.repository.js";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "../utils/errors.js";

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        role: "superadmin" | "admin" | "staff";
        permissions: string[];
        name: string;
      };
    }
  }
}

/**
 * Reusable Authentication Middleware.
 * Decodes the Bearer Token and verifies the latest Admin record exists in MongoDB.
 */
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new UnauthorizedError("AUTHENTICATION REQUIRED"));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(new UnauthorizedError("AUTHENTICATION REQUIRED"));
    }

    // Decode token parameters
    let decoded;
    try {
      decoded = jwtService.verifyAccessToken(token);
    } catch (e: any) {
      return next(new UnauthorizedError("AUTHENTICATION REQUIRED"));
    }

    // Fetch the latest user record from MongoDB - Never trust JWT payload alone
    const admin = await adminRepository.findById(decoded.userId);
    if (!admin) {
      return next(new NotFoundError("USER NOT FOUND"));
    }

    // Verify account is active
    if (!admin.isActive) {
      return next(new ForbiddenError("UNAUTHORIZED: ADMINISTRATIVE ACCOUNT IS INACTIVE"));
    }

    // Set request admin properties
    req.admin = {
      id: String(admin._id),
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
      name: admin.name,
    };

    next();
  } catch (e: any) {
    next(new UnauthorizedError("AUTHENTICATION REQUIRED"));
  }
};

/**
 * Reusable Authorization Middleware.
 * Assures user role matches one of superadmin, admin or staff.
 */
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.admin) {
      return next(new UnauthorizedError("AUTHENTICATION REQUIRED"));
    }

    const validRoles = ["superadmin", "admin", "staff"];
    if (!validRoles.includes(req.admin.role)) {
      return next(new ForbiddenError("YOU ARE NOT AUTHORIZED TO ACCESS THE ADMIN PORTAL"));
    }

    next();
  } catch (e) {
    next(e);
  }
};

/**
 * Higher-order middleware enforcing role checking controls
 */
export const requireRole = (allowedRoles: ("superadmin" | "admin" | "staff")[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.admin) {
        return next(new UnauthorizedError("AUTHENTICATION REQUIRED"));
      }

      if (!allowedRoles.includes(req.admin.role)) {
        return next(new ForbiddenError("UNAUTHORIZED: INSUFFICIENT ROLE PRIVILEGES"));
      }

      next();
    } catch (e) {
      next(e);
    }
  };
};

/**
 * Higher-order middleware enforcing permission authorization checks
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.admin) {
        return next(new UnauthorizedError("AUTHENTICATION REQUIRED"));
      }

      // Super Admins override all permissions
      if (req.admin.role === "superadmin" || req.admin.permissions.includes("*")) {
        return next();
      }

      if (!req.admin.permissions.includes(permission)) {
        return next(new ForbiddenError(`UNAUTHORIZED: INSUFFICIENT PERMISSIONS. REQUIRED: ${permission}`));
      }

      next();
    } catch (e) {
      next(e);
    }
  };
};
