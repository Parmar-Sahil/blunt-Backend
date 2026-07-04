import { z } from "zod";

const imageValidationSchema = z.object({
  publicId: z.string().min(1, "PUBLIC ID IS REQUIRED"),
  url: z.string().url("IMAGE MUST BE A VALID URL"),
  alt: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  isThumbnail: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

const variantValidationSchema = z.object({
  color: z.string().min(1, "COLOR IS REQUIRED"),
  size: z.string().min(1, "SIZE IS REQUIRED"),
  sku: z.string().min(1, "SKU IS REQUIRED"),
  barcode: z.string().optional(),
  priceOverride: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative("STOCK CANNOT BE NEGATIVE"),
  reservedStock: z.number().int().nonnegative().optional(),
  availableStock: z.number().int().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  status: z.enum(["active", "inactive", "out-of-stock"]).optional(),
});

export const productCreateSchema = z.object({
  name: z.string().min(2, "NAME MUST BE AT LEAST 2 CHARACTERS").max(200),
  slug: z.string().optional(),
  quote: z.string().max(200).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().min(10, "DESCRIPTION IS REQUIRED"),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "INVALID CATEGORY OBJECTID"),
  collectionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "INVALID COLLECTION OBJECTID").nullable().optional(),
  labels: z
    .array(
      z.enum([
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
      ])
    )
    .optional(),
  visibility: z.enum(["public", "private", "members-only", "coming-soon"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  seo: z
    .object({
      metaTitle: z.string().max(100).optional(),
      metaDescription: z.string().max(200).optional(),
      canonicalUrl: z.string().optional(),
    })
    .optional(),
  searchText: z.string().optional(),
  images: z.array(imageValidationSchema).optional(),
  thumbnail: z.string().optional(),
  variants: z.array(variantValidationSchema).min(1, "PRODUCT MUST HAVE AT LEAST ONE VARIANT"),
  price: z.number().nonnegative("PRICE MUST BE NON-NEGATIVE"),
  mrp: z.number().nonnegative("MRP MUST BE NON-NEGATIVE"),
  discount: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  isFeatured: z.boolean().optional(),
  displayPriority: z.number().int().optional(),
  scheduledPublishAt: z.string().optional().nullable(),
});

export const productUpdateSchema = productCreateSchema.partial();
