import mongoose, { Schema, Document } from "mongoose";

export interface IImage {
  publicId: string;
  url: string;
  alt: string;
  width?: number;
  height?: number;
  isThumbnail: boolean;
  sortOrder: number;
}

export interface IVariant {
  color: string;
  size: string;
  sku: string;
  barcode?: string;
  priceOverride?: number;
  stock: number;
  reservedStock: number;
  availableStock: number;
  weight: number;
  status: "active" | "inactive" | "out-of-stock";
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  quote?: string;
  shortDescription?: string;
  description: string;
  categoryId: mongoose.Types.ObjectId | string;
  collectionId?: mongoose.Types.ObjectId | string | null;
  labels: string[];
  visibility: "public" | "private" | "members-only" | "coming-soon";
  status: "draft" | "published" | "archived";
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
  };
  searchText?: string;
  images: IImage[];
  thumbnail: string;
  variants: IVariant[];
  price: number;
  mrp: number;
  discount: number;
  tax: number;
  isFeatured: boolean;
  displayPriority: number;
  scheduledPublishAt?: Date | null;
  createdBy: mongoose.Types.ObjectId | string;
  updatedBy: mongoose.Types.ObjectId | string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>({
  publicId: { type: String, required: true },
  url: { type: String, required: true },
  alt: { type: String, default: "" },
  width: { type: Number },
  height: { type: Number },
  isThumbnail: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
});

const VariantSchema = new Schema<IVariant>({
  color: { type: String, required: true, trim: true },
  size: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true, index: true },
  barcode: { type: String, default: "" },
  priceOverride: { type: Number, default: null },
  stock: { type: Number, required: true, default: 0 },
  reservedStock: { type: Number, required: true, default: 0 },
  availableStock: { type: Number, required: true, default: 0 },
  weight: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["active", "inactive", "out-of-stock"],
    default: "active",
  },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    quote: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    description: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    collectionId: { type: Schema.Types.ObjectId, ref: "Collection", default: null, index: true },
    labels: {
      type: [String],
      enum: [
        "new-arrival",
        "best-seller",
        "featured",
        "premium",
        "trending",
        "limited-edition",
        "exclusive",
        "recommended",
        "coming-soon",
        "pre-order",
      ],
      default: [],
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "members-only", "coming-soon"],
      default: "public",
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    seo: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      canonicalUrl: { type: String, default: "" },
    },
    searchText: { type: String, default: "", index: true },
    images: [ImageSchema],
    thumbnail: { type: String, default: "" },
    variants: [VariantSchema],
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    displayPriority: { type: Number, default: 0, index: true },
    scheduledPublishAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.Mixed, default: "system" },
    updatedBy: { type: Schema.Types.Mixed, default: "system" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// MongoDB Text Indexes for rich text search capabilities
ProductSchema.index(
  {
    name: "text",
    quote: "text",
    description: "text",
    searchText: "text",
    "variants.sku": "text",
    labels: "text",
  },
  {
    weights: {
      name: 10,
      searchText: 8,
      quote: 5,
      "variants.sku": 5,
      description: 2,
      labels: 1,
    },
    name: "ProductTextIndex",
  }
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
export default Product;
