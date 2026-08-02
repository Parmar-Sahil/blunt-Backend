import mongoose, { Schema, Document } from "mongoose";

export interface ICheckoutItem {
  productId: mongoose.Types.ObjectId | string;
  variantId: string; // SKU reference
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ICheckoutAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface ICheckout extends Document {
  checkoutId: string;
  userId: mongoose.Types.ObjectId | string;
  cartId: mongoose.Types.ObjectId | string;
  items: ICheckoutItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  shippingAddress: ICheckoutAddress;
  billingAddress: ICheckoutAddress;
  paymentGateway: "razorpay" | "stripe";
  status: "pending" | "expired" | "completed" | "cancelled";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CheckoutAddressSchema = new Schema<ICheckoutAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
});

const CheckoutItemSchema = new Schema<ICheckoutItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: String, required: true }, // SKU
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
});

const CheckoutSchema = new Schema<ICheckout>(
  {
    checkoutId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cartId: { type: Schema.Types.ObjectId, ref: "Cart", required: true, index: true },
    items: [CheckoutItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    shippingAddress: { type: CheckoutAddressSchema, required: true },
    billingAddress: { type: CheckoutAddressSchema, required: true },
    paymentGateway: { type: String, enum: ["razorpay", "stripe"], required: true },
    status: {
      type: String,
      enum: ["pending", "expired", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index to automatically clean up expired checkout sessions
CheckoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Checkout = mongoose.models.Checkout || mongoose.model<ICheckout>("Checkout", CheckoutSchema);
export default Checkout;
