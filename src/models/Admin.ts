import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "superadmin" | "admin" | "staff";
  permissions: string[];
  phone?: string;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  createdBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "staff"],
      required: true,
      default: "staff",
    },
    permissions: { type: [String], default: [] },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
    lastLogin: { type: Date },
    createdBy: { type: Schema.Types.Mixed, default: "system" },
  },
  { timestamps: true }
);

export const AdminModel = mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);
export default AdminModel;
