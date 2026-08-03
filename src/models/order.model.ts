import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId | string;
  variantId: string; // SKU
  productName: string;
  quote?: string;
  productImage?: string;
  color: string;
  size: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface IOrderAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId | string;
  checkoutId: string;
  paymentId?: string | null;
  paymentVerified: boolean;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  currency: string;
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  status:
    | "placed"
    | "pending"
    | "confirmed"
    | "packed"
    | "shipped"
    | "out-for-delivery"
    | "delivered"
    | "cancelled"
    | "returned"
    | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "partially-refunded";
  shippingStatus: "pending" | "processing" | "shipped" | "out-for-delivery" | "delivered" | "returned";
  trackingNumber?: string | null;
  courier?: string | null;
  adminNotes?: string | null;
  customerNotes?: string | null;
  deliveredAt?: Date | null;
  returnEligibleUntil?: Date | null;
  hasReturnRequest?: boolean;
  returnStatus?: string | null;
  canReturn?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: String, required: true },
  productName: { type: String, required: true },
  quote: { type: String, default: "" },
  productImage: { type: String, default: "" },
  color: { type: String, required: true },
  size: { type: String, required: true },
  sku: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
});

const OrderAddressSchema = new Schema<IOrderAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    checkoutId: { type: String, required: true, index: true },
    paymentId: { type: String, default: null },
    paymentVerified: { type: Boolean, default: false },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    shippingAddress: { type: OrderAddressSchema, required: true },
    billingAddress: { type: OrderAddressSchema, required: true },
    status: {
      type: String,
      enum: [
        "placed",
        "pending",
        "confirmed",
        "packed",
        "shipped",
        "out-for-delivery",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      default: "placed",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially-refunded"],
      default: "pending",
      index: true,
    },
    shippingStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "out-for-delivery", "delivered", "returned"],
      default: "pending",
      index: true,
    },
    trackingNumber: { type: String, default: null },
    courier: { type: String, default: null },
    adminNotes: { type: String, default: "" },
    customerNotes: { type: String, default: "" },
    deliveredAt: { type: Date, default: null },
    returnEligibleUntil: { type: Date, default: null },
    hasReturnRequest: { type: Boolean, default: false },
    returnStatus: { type: String, default: null },
    canReturn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
