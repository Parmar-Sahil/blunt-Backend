import { Request, Response } from "express";
import checkoutService from "../services/checkout.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errors.js";

export const initiateCheckout = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED TO INITIATE CHECKOUT");
  }

  const session = await checkoutService.createCheckoutSession({
    userId,
    shippingAddress: req.body.shippingAddress,
    billingAddress: req.body.billingAddress,
    shippingMethod: req.body.shippingMethod,
  });

  sendResponse(res, 201, true, "CHECKOUT SESSION CREATED SUCCESSFULLY", session);
});

export const getCheckout = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED TO FETCH CHECKOUT");
  }

  const { checkoutId } = req.params;
  if (!checkoutId) {
    throw new BadRequestError("CHECKOUT ID IS REQUIRED");
  }

  const session = await checkoutService.getCheckoutSession(checkoutId, userId);
  sendResponse(res, 200, true, "CHECKOUT SESSION RETRIEVED SUCCESSFULLY", session);
});

export const cancelCheckout = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED TO CANCEL CHECKOUT");
  }

  const { checkoutId } = req.params;
  if (!checkoutId) {
    throw new BadRequestError("CHECKOUT ID IS REQUIRED");
  }

  const session = await checkoutService.cancelCheckoutSession(checkoutId, userId);
  sendResponse(res, 200, true, "CHECKOUT SESSION CANCELLED SUCCESSFULLY", session);
});
