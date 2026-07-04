import { z } from "zod";

export const paymentCreateSchema = z.object({
  checkoutId: z.string().min(5, "INVALID CHECKOUT ID"),
});

export const paymentVerifySchema = z.object({
  paymentId: z.string().min(5, "INVALID PAYMENT ID"),
  gateway: z.enum(["stripe", "razorpay"]),
  gatewayPaymentId: z.string().optional().nullable(),
  gatewayOrderId: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
});
