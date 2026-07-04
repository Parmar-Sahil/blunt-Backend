import { Request, Response } from "express";
import orderService from "../services/order.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { BadRequestError } from "../utils/errors.js";
import {
  orderCreateSchema,
  orderStatusUpdateSchema,
  orderShippingUpdateSchema,
  orderPaymentUpdateSchema,
  orderNotesUpdateSchema,
} from "../validators/order.schema.js";

// Customer Endpoints
export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED TO PLACE AN ORDER");
  }

  const payload = orderCreateSchema.parse(req.body);

  const order = await orderService.createOrderFromCheckout({
    userId,
    checkoutId: payload.checkoutId,
    paymentId: payload.paymentId,
    paymentVerified: payload.paymentVerified,
    customerNotes: payload.customerNotes,
  });

  sendResponse(res, 201, true, "ORDER CREATED SUCCESSFULLY", order);
});

export const getCustomerOrderDetails = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED");
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID ORDER OBJECTID");
  }

  const order = await orderService.getOrderById(id, userId, false);
  sendResponse(res, 200, true, "ORDER RETRIEVED SUCCESSFULLY", order);
});

export const getCustomerOrdersList = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED");
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;

  const result = await orderService.getCustomerOrders(userId, page, limit, status);
  sendResponse(res, 200, true, "ORDERS RETRIEVED SUCCESSFULLY", result);
});

// Admin Endpoints
export const getAdminOrdersList = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const status = req.query.status as string;
  const paymentStatus = req.query.paymentStatus as string;
  const shippingStatus = req.query.shippingStatus as string;
  const courier = req.query.courier as string;
  const userId = req.query.userId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const sortBy = req.query.sortBy as string;

  const result = await orderService.getAdminOrders({
    page,
    limit,
    search,
    status,
    paymentStatus,
    shippingStatus,
    courier,
    userId,
    startDate,
    endDate,
    sortBy,
  });

  sendResponse(res, 200, true, "ADMIN ORDERS RETRIEVED SUCCESSFULLY", result);
});

export const getAdminOrderDetails = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || "system";
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID ORDER OBJECTID");
  }

  const order = await orderService.getOrderById(id, userId, true);
  sendResponse(res, 200, true, "ORDER RETRIEVED SUCCESSFULLY", order);
});

export const adminUpdateStatus = asyncHandler(async (req: Request, res: Response) => {
  const actorId = (req as any).user?.userId || "system";
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID ORDER OBJECTID");
  }

  const payload = orderStatusUpdateSchema.parse(req.body);
  const order = await orderService.updateOrderStatus(id, payload.status, actorId);

  sendResponse(res, 200, true, "ORDER STATUS UPDATED SUCCESSFULLY", order);
});

export const adminUpdateShipping = asyncHandler(async (req: Request, res: Response) => {
  const actorId = (req as any).user?.userId || "system";
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID ORDER OBJECTID");
  }

  const payload = orderShippingUpdateSchema.parse(req.body);
  const order = await orderService.updateOrderShipping(
    id,
    payload.courier,
    payload.trackingNumber,
    actorId
  );

  sendResponse(res, 200, true, "ORDER SHIPPING UPDATED SUCCESSFULLY", order);
});

export const adminUpdatePayment = asyncHandler(async (req: Request, res: Response) => {
  const actorId = (req as any).user?.userId || "system";
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID ORDER OBJECTID");
  }

  const payload = orderPaymentUpdateSchema.parse(req.body);
  const order = await orderService.updateOrderPayment(
    id,
    payload.paymentStatus,
    payload.paymentId || null,
    actorId
  );

  sendResponse(res, 200, true, "ORDER PAYMENT UPDATED SUCCESSFULLY", order);
});

export const adminUpdateNotes = asyncHandler(async (req: Request, res: Response) => {
  const actorId = (req as any).user?.userId || "system";
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID ORDER OBJECTID");
  }

  const payload = orderNotesUpdateSchema.parse(req.body);
  const order = await orderService.updateOrderNotes(id, payload.adminNotes, actorId);

  sendResponse(res, 200, true, "ORDER ADMIN NOTES UPDATED SUCCESSFULLY", order);
});
