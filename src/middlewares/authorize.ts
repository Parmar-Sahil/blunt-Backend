import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

export const authorize = (...allowedRoles: ("customer" | "admin" | "superadmin" | "staff")[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("AUTHENTICATION IS REQUIRED"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("INSUFFICIENT ROLE PERMISSIONS"));
    }

    next();
  };
};

export const requireRole = (...allowedRoles: ("customer" | "admin" | "superadmin" | "staff")[]) => {
  return authorize(...allowedRoles);
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("AUTHENTICATION IS REQUIRED"));
    }

    if (req.user.role === "superadmin") {
      return next();
    }

    const userPermissions = (req.user as any).permissions || [];
    if (!userPermissions.includes(permission) && !userPermissions.includes("*")) {
      return next(new ForbiddenError(`UNAUTHORIZED: INSUFFICIENT PERMISSIONS. REQUIRED: ${permission}`));
    }

    next();
  };
};

export default authorize;
