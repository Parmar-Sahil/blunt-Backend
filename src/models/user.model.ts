import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  productId: string;
  size: string;
  quantity: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "customer" | "admin" | "superadmin";
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  addresses: string[];
  wishlist: string[];
  cart: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  productId: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
}, { _id: false });

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin", "superadmin"], default: "customer" },
    phone: { type: String },
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    addresses: { type: [String], default: [] },
    wishlist: { type: [String], default: [] },
    cart: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default UserModel;
