import mongoose, { Schema, Document } from "mongoose";

export interface IReturnItem {
  productId: mongoose.Types.ObjectId | string;
  productName: string;
  unitPrice: number;
  quantity: number;
  size: string;
  color: string;
}

export interface IReturnRequest extends Document {
  orderId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  items: IReturnItem[];
  returnType: "refund" | "exchange";
  reason:
    | "Wrong Size"
    | "Wrong Product"
    | "Damaged"
    | "Defective"
    | "Didn't Like It"
    | "Quality Issue"
    | "Other";
  description?: string;
  images: string[];
  status:
    | "requested"
    | "approved"
    | "rejected"
    | "pickupScheduled"
    | "pickedUp"
    | "received"
    | "qualityChecked"
    | "refundProcessed"
    | "completed";
  adminNotes: string;
  requestedAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema<IReturnItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
});

const ReturnRequestSchema = new Schema<IReturnRequest>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [ReturnItemSchema],
    returnType: { type: String, enum: ["refund", "exchange"], required: true },
    reason: {
      type: String,
      enum: [
        "Wrong Size",
        "Wrong Product",
        "Damaged",
        "Defective",
        "Didn't Like It",
        "Quality Issue",
        "Other",
      ],
      required: true,
    },
    description: { type: String, default: "" },
    images: [{ type: String }],
    status: {
      type: String,
      enum: [
        "requested",
        "approved",
        "rejected",
        "pickupScheduled",
        "pickedUp",
        "received",
        "qualityChecked",
        "refundProcessed",
        "completed",
      ],
      default: "requested",
      index: true,
    },
    adminNotes: { type: String, default: "" },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ReturnRequest =
  mongoose.models.ReturnRequest ||
  mongoose.model<IReturnRequest>("ReturnRequest", ReturnRequestSchema);

export default ReturnRequest;
