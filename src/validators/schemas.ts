import { z } from "zod";

export const productValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"),
  collections: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Collection ID")).optional(),
  status: z.enum(["Active", "Draft", "Archived"]).default("Draft"),
});

export const categoryValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  parentCategory: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Parent Category ID").optional(),
});

export const collectionValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
});

export const addressValidationSchema = z.object({
  type: z.enum(["Home", "Work", "Other", "Default", "Billing", "Shipping"]).default("Home"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  zip: z.string().min(1, "Zip code is required"),
});

export const cartItemValidationSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID"),
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
});
