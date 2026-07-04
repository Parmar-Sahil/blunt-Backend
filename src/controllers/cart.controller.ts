import { Request, Response } from "express";
import cartService from "../services/cart.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errors.js";

const getCartCredentials = (req: Request) => {
  const userId = (req as any).user?.userId;
  const guestId = (req.headers["x-guest-id"] as string) || (req.query.guestId as string) || (req.body.guestId as string);
  return { userId, guestId };
};

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const { userId, guestId } = getCartCredentials(req);
  if (!userId && !guestId) {
    throw new BadRequestError("AUTHENTICATION OR X-GUEST-ID HEADER IS REQUIRED");
  }

  const cart = await cartService.getOrCreateCart({ userId, guestId });
  const populated = await cartService.recalculateCart(cart);
  sendResponse(res, 200, true, "CART RETRIEVED SUCCESSFULLY", populated);
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const { userId, guestId } = getCartCredentials(req);
  if (!userId && !guestId) {
    throw new BadRequestError("AUTHENTICATION OR X-GUEST-ID HEADER IS REQUIRED");
  }

  const { productId, variantId, quantity } = req.body;
  const cart = await cartService.addItem({
    userId,
    guestId,
    productId,
    variantId,
    quantity,
  });

  sendResponse(res, 200, true, "ITEM ADDED TO CART SUCCESSFULLY", cart);
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { userId, guestId } = getCartCredentials(req);
  if (!userId && !guestId) {
    throw new BadRequestError("AUTHENTICATION OR X-GUEST-ID HEADER IS REQUIRED");
  }

  const variantId = req.params.id; // path param maps to variantId (SKU)
  const { quantity } = req.body;

  const cart = await cartService.updateQuantity({
    userId,
    guestId,
    variantId,
    quantity,
  });

  sendResponse(res, 200, true, "CART ITEM QUANTITY UPDATED SUCCESSFULLY", cart);
});

export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
  const { userId, guestId } = getCartCredentials(req);
  if (!userId && !guestId) {
    throw new BadRequestError("AUTHENTICATION OR X-GUEST-ID HEADER IS REQUIRED");
  }

  const variantId = req.params.id; // path param maps to variantId (SKU)
  const cart = await cartService.removeItem({
    userId,
    guestId,
    variantId,
  });

  sendResponse(res, 200, true, "ITEM REMOVED FROM CART SUCCESSFULLY", cart);
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const { userId, guestId } = getCartCredentials(req);
  if (!userId && !guestId) {
    throw new BadRequestError("AUTHENTICATION OR X-GUEST-ID HEADER IS REQUIRED");
  }

  const cart = await cartService.clearCart({ userId, guestId });
  sendResponse(res, 200, true, "CART CLEARED SUCCESSFULLY", cart);
});

export const mergeCarts = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new BadRequestError("AUTHENTICATION IS REQUIRED TO MERGE CARTS");
  }

  const { guestId } = req.body;
  if (!guestId) {
    throw new BadRequestError("GUEST ID TO MERGE FROM IS REQUIRED");
  }

  const cart = await cartService.mergeCarts(userId, guestId);
  sendResponse(res, 200, true, "CARTS MERGED SUCCESSFULLY", cart);
});
