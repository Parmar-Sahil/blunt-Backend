import mongoose, { Schema, Document } from "mongoose";

export interface IAddress extends Document {
  user: mongoose.Types.ObjectId;
  type: "Default" | "Billing" | "Shipping";
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["Default", "Billing", "Shipping"], default: "Shipping" },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zip: { type: String, required: true },
  },
  { timestamps: true }
);

export const Address = mongoose.model<IAddress>("Address", AddressSchema);
export default Address;
