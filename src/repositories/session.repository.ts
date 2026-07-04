import SessionModel, { ISession } from "../models/session.model.js";
import mongoose from "mongoose";

export class SessionRepository {
  async createSession(sessionData: {
    userId: mongoose.Types.ObjectId;
    refreshTokenHash: string;
    device?: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): Promise<ISession> {
    const session = new SessionModel(sessionData);
    return session.save();
  }

  async findSessionByHash(refreshTokenHash: string): Promise<ISession | null> {
    return SessionModel.findOne({ refreshTokenHash }).populate("userId");
  }

  async deleteSessionByHash(refreshTokenHash: string): Promise<any> {
    return SessionModel.deleteOne({ refreshTokenHash });
  }

  async deleteSessionsByUserId(userId: string): Promise<any> {
    return SessionModel.deleteMany({ userId });
  }
}

export const sessionRepository = new SessionRepository();
