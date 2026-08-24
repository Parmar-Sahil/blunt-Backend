import { Request, Response } from "express";
import paymentService from "../services/payment.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errors.js";
import { paymentCreateSchema, paymentVerifySchema } from "../validators/payment.schema.js";

// Customer Endpoints
export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED TO INITIATE PAYMENT");
  }

  const payload = paymentCreateSchema.parse(req.body);
  const session = await paymentService.createPaymentSession(userId, payload.checkoutId, payload.gateway);

  sendResponse(res, 201, true, "PAYMENT SESSION INITIALIZED SUCCESSFULLY", session);
});

export const verifyPaymentEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED");
  }

  const payload = paymentVerifySchema.parse(req.body);
  const result = await paymentService.verifyPayment({
    paymentId: payload.paymentId,
    gateway: payload.gateway,
    gatewayPaymentId: payload.gatewayPaymentId,
    gatewayOrderId: payload.gatewayOrderId,
    signature: payload.signature,
  });

  sendResponse(res, 200, true, "PAYMENT VERIFICATION PROCESSED", result);
});

export const getPaymentDetails = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED");
  }

  const { paymentId } = req.params;
  if (!paymentId) {
    throw new BadRequestError("PAYMENT ID IS REQUIRED");
  }

  const result = await paymentService.getPayment(paymentId, userId, false);
  sendResponse(res, 200, true, "PAYMENT RECORD RETRIEVED SUCCESSFULLY", result);
});

// Admin Endpoints
export const getAdminPaymentsList = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const gateway = req.query.gateway as string;
  const status = req.query.status as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const result = await paymentService.getAdminPayments({
    page,
    limit,
    gateway,
    status,
    startDate,
    endDate,
  });

  sendResponse(res, 200, true, "ADMIN PAYMENTS RETRIEVED SUCCESSFULLY", result);
});

// Webhook Endpoints
export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  if (!signature) {
    throw new BadRequestError("MISSING STRIPE SIGNATURE HEADER");
  }

  // Stripe constructEvent requires the raw body buffer
  const rawBody = (req as any).rawBody || req.body;
  await paymentService.handleWebhook({
    gateway: "stripe",
    rawBody,
    signature,
  });

  res.status(200).json({ received: true });
});

export const razorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  if (!signature) {
    throw new BadRequestError("MISSING RAZORPAY SIGNATURE HEADER");
  }

  const rawBody = (req as any).rawBody || req.body;
  await paymentService.handleWebhook({
    gateway: "razorpay",
    rawBody,
    signature,
  });

  res.status(200).json({ received: true });
});

// Placeholders
export const processRefundPlaceholder = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Refund Processing - Hook gateway specific refund calls
  sendResponse(res, 200, true, "REFUND REQUEST RECORDED (PLACEHOLDER)");
});
