import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  paymentId: string;
  orderId?: mongoose.Types.ObjectId | string | null;
  checkoutId: string;
  userId: mongoose.Types.ObjectId | string;
  gateway: "stripe" | "razorpay";
  transactionId?: string | null;
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  currency: string;
  amount: number;
  status:
    | "created"
    | "pending"
    | "authorized"
    | "paid"
    | "failed"
    | "cancelled"
    | "expired"
    | "refunded"
    | "partially-refunded";
  failureReason?: string | null;
  refundStatus?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null, index: true },
    checkoutId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    gateway: { type: String, enum: ["stripe", "razorpay"], required: true },
    transactionId: { type: String, default: null, index: true },
    gatewayOrderId: { type: String, default: null, index: true },
    gatewayPaymentId: { type: String, default: null, index: true },
    currency: { type: String, required: true, default: "INR" },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "authorized",
        "paid",
        "failed",
        "cancelled",
        "expired",
        "refunded",
        "partially-refunded",
      ],
      default: "created",
      index: true,
    },
    failureReason: { type: String, default: null },
    refundStatus: { type: String, default: null },
    metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
export default Payment;
