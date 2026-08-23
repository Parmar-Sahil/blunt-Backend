import mongoose, { Schema, Document } from "mongoose";

export interface IDrop extends Document {
  dropNumber: number;
  displayNumber: string;
  formattedDropNumber: string;
  name: string;
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  heroImage: string;
  galleryImages: string[];
  productIds: mongoose.Types.ObjectId[];
  releaseDate?: Date;
  status: "draft" | "active" | "archived";
  isLatest: boolean;
  createdBy?: mongoose.Types.ObjectId | string;
  updatedBy?: mongoose.Types.ObjectId | string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DropSchema = new Schema<IDrop>(
  {
    dropNumber: { type: Number, required: true, unique: true, index: true },
    displayNumber: { type: String, required: true },
    formattedDropNumber: { type: String, required: true },
    name: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    subtitle: { type: String, default: "" },
    description: { type: String, default: "" },
    heroImage: { type: String, required: true },
    galleryImages: { type: [String], default: [] },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    releaseDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true,
    },
    isLatest: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.Mixed, default: "system" },
    updatedBy: { type: Schema.Types.Mixed, default: "system" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Pre-validate hook to calculate formattedDropNumber and displayNumber safely
DropSchema.pre("validate", function (next) {
  if (this.dropNumber != null) {
    const num = this.dropNumber;
    const padded = num < 10 ? `00${num}` : num < 100 ? `0${num}` : `${num}`;
    this.formattedDropNumber = padded;
    this.displayNumber = `DROP ${padded}`;
    if (!this.name) {
      this.name = `Drop ${padded}`;
    }
    if (!this.slug) {
      this.slug = `drop-${padded}`;
    }
  }
  next();
});

export const Drop = mongoose.models.Drop || mongoose.model<IDrop>("Drop", DropSchema);
export default Drop;
