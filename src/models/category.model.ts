import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  displayOrder: number;
  status: "active" | "inactive" | "draft" | "archived";
  isFeatured: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  parentCategory?: mongoose.Types.ObjectId | string;
  createdBy?: mongoose.Types.ObjectId | string;
  updatedBy?: mongoose.Types.ObjectId | string;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    icon: { type: String, default: "" },
    displayOrder: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ["active", "inactive", "draft", "archived"],
      default: "active",
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    seo: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
    },
    parentCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    createdBy: { type: Schema.Types.Mixed, default: "system" },
    updatedBy: { type: Schema.Types.Mixed, default: "system" },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
export default Category;
