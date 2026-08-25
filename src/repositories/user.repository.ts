import UserModel, { IUser } from "../models/user.model.js";

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    const normalized = email.trim().toLowerCase();
    return UserModel.findOne({
      $or: [
        { email: normalized },
        { email: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      ],
    });
  }

  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id);
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return UserModel.findOne({ googleId });
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    if (userData.email) {
      userData.email = userData.email.trim().toLowerCase();
    }
    const user = new UserModel(userData);
    return user.save();
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
    }
    return UserModel.findByIdAndUpdate(id, updateData, { new: true });
  }
}

export const userRepository = new UserRepository();
