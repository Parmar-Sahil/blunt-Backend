import mongoose, { Schema, Document } from "mongoose";

export interface ICollection extends Document {
  name: string;
  slug: string;
  description?: string;
  bannerImage?: string;
  thumbnail?: string;
  displayOrder: number;
  status: "active" | "inactive" | "draft" | "archived";
  isFeatured: boolean;
  startDate?: Date;
  endDate?: Date;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdBy?: mongoose.Types.ObjectId | string;
  updatedBy?: mongoose.Types.ObjectId | string;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    displayOrder: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ["active", "inactive", "draft", "archived"],
      default: "active",
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    seo: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
    },
    createdBy: { type: Schema.Types.Mixed, default: "system" },
    updatedBy: { type: Schema.Types.Mixed, default: "system" },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const Collection = mongoose.models.Collection || mongoose.model<ICollection>("Collection", CollectionSchema);
export default Collection;
