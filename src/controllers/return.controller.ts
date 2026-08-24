import { Request, Response } from "express";
import ReturnRequest from "../models/returnRequest.model.js";
import Order from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import notificationService from "../services/notification.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

// CUSTOMER CONTROLLERS

/**
 * Submits a new return/exchange request
 */
export const createReturnRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED");
  }

  const { orderId, returnType, reason, description, images, items } = req.body;

  // 1. Fetch order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError("ORDER NOT FOUND");
  }

  // 2. Validate ownership
  if (String(order.userId) !== String(userId)) {
    throw new BadRequestError("UNAUTHORIZED: YOU DO NOT OWN THIS ORDER RECORD");
  }

  // 3. Validate status
  if (order.status !== "delivered") {
    throw new BadRequestError("INELIGIBLE: ORDER HAS NOT BEEN MARKED AS DELIVERED YET");
  }

  // 4. Check if already requested
  if (order.hasReturnRequest) {
    throw new BadRequestError("INELIGIBLE: A RETURN REQUEST ALREADY EXISTS FOR THIS ORDER");
  }

  // 5. Check if window expired
  if (order.returnEligibleUntil && new Date() > new Date(order.returnEligibleUntil)) {
    throw new BadRequestError("INELIGIBLE: THE 7-DAY RETURN WINDOW FOR THIS ORDER HAS EXPIRED");
  }

  // 6. Create Return Request
  const returnReq = await ReturnRequest.create({
    orderId,
    userId,
    returnType,
    reason,
    description: description || "",
    images: images || [],
    items: items || order.items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
    status: "requested",
  });

  // 7. Update Order status
  order.hasReturnRequest = true;
  order.returnStatus = "requested";
  await order.save();

  // 8. Dispatch Email
  const user: any = await UserModel.findById(userId).lean();
  if (user && user.email) {
    await notificationService.sendReturnRequested(userId, user.email, order.orderNumber);
  }

  sendResponse(res, 201, true, "RETURN REQUEST SUBMITTED SUCCESSFULLY", returnReq);
});

/**
 * Lists return requests for the current customer
 */
export const getCustomerReturnsList = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED");
  }

  const returns = await ReturnRequest.find({ userId }).populate("orderId").sort({ createdAt: -1 });
  sendResponse(res, 200, true, "RETURN REQUESTS RETRIEVED SUCCESSFULLY", returns);
});

/**
 * Retrieves specific return request details for customer
 */
export const getCustomerReturnDetails = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED");
  }

  const { id } = req.params;
  const returnReq = await ReturnRequest.findById(id).populate("orderId");
  if (!returnReq) {
    throw new NotFoundError("RETURN REQUEST NOT FOUND");
  }

  if (String(returnReq.userId) !== String(userId)) {
    throw new BadRequestError("UNAUTHORIZED ACCESS TO THIS RETURN RECORD");
  }

  sendResponse(res, 200, true, "RETURN DETAILS RETRIEVED SUCCESSFULLY", returnReq);
});


// ADMIN CONTROLLERS

/**
 * Lists all return requests in the system for admin
 */
export const getAdminReturnsList = asyncHandler(async (req: Request, res: Response) => {
  const returns = await ReturnRequest.find()
    .populate("orderId")
    .populate({ path: "userId", select: "name email" })
    .sort({ createdAt: -1 });
  sendResponse(res, 200, true, "ADMIN RETURN LIST RETRIEVED SUCCESSFULLY", returns);
});

/**
 * Updates status of a return request
 */
export const updateReturnRequestStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNotes, pickupDate } = req.body;

  const returnReq = await ReturnRequest.findById(id).populate("orderId");
  if (!returnReq) {
    throw new NotFoundError("RETURN REQUEST NOT FOUND");
  }

  const order = await Order.findById(returnReq.orderId);
  if (!order) {
    throw new NotFoundError("ASSOCIATED ORDER NOT FOUND");
  }

  const previousStatus = returnReq.status;
  returnReq.status = status;
  if (adminNotes !== undefined) {
    returnReq.adminNotes = adminNotes;
  }

  // Update timestamps
  if (status === "approved" && previousStatus !== "approved") {
    returnReq.approvedAt = new Date();
  }
  if (status === "completed" && previousStatus !== "completed") {
    returnReq.completedAt = new Date();
  }

  await returnReq.save();

  // Keep order returnStatus in sync
  order.returnStatus = status;
  if (status === "completed") {
    order.status = returnReq.returnType === "refund" ? "refunded" : "returned";
    order.paymentStatus = returnReq.returnType === "refund" ? "refunded" : order.paymentStatus;
  }
  await order.save();

  // Send status update emails
  const user: any = await UserModel.findById(returnReq.userId).lean();
  if (user && user.email) {
    if (status === "approved" && previousStatus !== "approved") {
      await notificationService.sendReturnApproved(String(user._id), user.email, order.orderNumber);
    } else if (status === "rejected" && previousStatus !== "rejected") {
      await notificationService.sendReturnRejected(
        String(user._id),
        user.email,
        order.orderNumber,
        adminNotes || "Items did not meet returns criteria."
      );
    } else if (status === "pickupScheduled" && previousStatus !== "pickupScheduled") {
      const formattedDate = pickupDate
        ? new Date(pickupDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
        : "Next Business Day";
      await notificationService.sendReturnPickupScheduled(String(user._id), user.email, order.orderNumber, formattedDate);
    } else if (status === "completed" && previousStatus !== "completed") {
      if (returnReq.returnType === "refund") {
        await notificationService.sendRefundCompleted(String(user._id), user.email, order.orderNumber, order.grandTotal);
      }
    }
  }

  sendResponse(res, 200, true, `RETURN STATUS UPDATED TO ${status.toUpperCase()}`, returnReq);
});
