import { Request, Response, NextFunction } from "express";
import { jwtService, JwtPayload } from "../services/jwt.service.js";
import { UnauthorizedError } from "../utils/errors.js";

// Extend Request type to include user context payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("BEARER TOKEN IS REQUIRED");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("INVALID BEARER TOKEN FORMAT");
    }

    const decoded = jwtService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (e: any) {
    next(new UnauthorizedError(e.message || "UNAUTHORIZED ACCESS TOKEN"));
  }
};

export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwtService.verifyAccessToken(token);
        req.user = decoded;
      }
    }
    next();
  } catch (e) {
    // Optional decoding issues are ignored so user resolves as a guest
    next();
  }
};
