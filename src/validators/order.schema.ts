import { z } from "zod";

export const orderCreateSchema = z.object({
  checkoutId: z.string().min(5, "INVALID CHECKOUT ID"),
  paymentId: z.string().optional().nullable(),
  paymentVerified: z.boolean().default(false),
  customerNotes: z.string().max(500).optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "placed",
    "pending",
    "confirmed",
    "packed",
    "shipped",
    "out-for-delivery",
    "delivered",
    "cancelled",
    "returned",
    "refunded",
  ]),
});

export const orderShippingUpdateSchema = z.object({
  courier: z.string().min(2, "COURIER NAME IS TOO SHORT"),
  trackingNumber: z.string().min(4, "TRACKING NUMBER IS TOO SHORT"),
});

export const orderPaymentUpdateSchema = z.object({
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded", "partially-refunded"]),
  paymentId: z.string().optional().nullable(),
});

export const orderNotesUpdateSchema = z.object({
  adminNotes: z.string().max(1000, "ADMIN NOTES CANNOT EXCEED 1000 CHARACTERS"),
});
