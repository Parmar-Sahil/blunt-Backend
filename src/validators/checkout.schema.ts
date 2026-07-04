import { z } from "zod";

const addressSchema = z.object({
  street: z.string().min(3, "STREET IS TOO SHORT"),
  city: z.string().min(2, "CITY IS TOO SHORT"),
  state: z.string().min(2, "STATE IS TOO SHORT"),
  country: z.string().min(2, "COUNTRY IS REQUIRED"),
  zipCode: z.string().min(4, "ZIP CODE IS REQUIRED"),
});

export const checkoutSessionSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  shippingMethod: z.enum(["Standard", "Express", "International"]).default("Standard"),
});
