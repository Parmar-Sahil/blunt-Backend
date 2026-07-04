import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export const rateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client identifier by path + IP
    const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    record.count++;
    
    if (record.count > options.max) {
      const minutesLeft = Math.ceil((record.resetAt - now) / 60000);
      return next(
        new AppError(
          `${options.message} PLEASE TRY AGAIN IN ${minutesLeft} MINUTE${minutesLeft > 1 ? "S" : ""}.`,
          429
        )
      );
    }

    next();
  };
};

export default rateLimiter;
