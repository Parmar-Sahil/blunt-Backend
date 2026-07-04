import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_SECRET || "supersecretaccessjwtkeyvalue12345678";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "supersecretrefreshjwtkeyvalue87654321";

const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "30d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: "customer" | "admin" | "superadmin" | "staff";
}

export class JwtService {
  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY as any });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY as any });
  }

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
  }

  verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
  }

  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}

export const jwtService = new JwtService();
