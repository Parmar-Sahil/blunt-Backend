import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "INVALID PRODUCT ID"),
  variantId: z.string().min(1, "VARIANT ID (SKU) IS REQUIRED"),
  quantity: z.number().int().min(1, "QUANTITY MUST BE AT LEAST 1").max(50, "MAXIMUM 50 UNITS ALLOWED PER ITEM"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "QUANTITY MUST BE AT LEAST 1").max(50, "MAXIMUM 50 UNITS ALLOWED PER ITEM"),
});

export const mergeCartSchema = z.object({
  guestId: z.string().min(1, "GUEST ID IS REQUIRED"),
});
