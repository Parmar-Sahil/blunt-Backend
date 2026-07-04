import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  productId: mongoose.Types.ObjectId | string;
  variantId: string; // SKU or variant ObjectId
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ICart extends Document {
  userId?: mongoose.Types.ObjectId | string | null;
  guestId?: string | null;
  items: ICartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponId?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: String, required: true }, // SKU reference
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
});

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, default: null },
    guestId: { type: String, index: true, default: null },
    items: [CartItemSchema],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    couponId: { type: String, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// TTL index to clean up expired guest carts automatically after 30 days
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Cart = mongoose.models.Cart || mongoose.model<ICart>("Cart", CartSchema);
export default Cart;
