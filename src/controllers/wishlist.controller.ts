import { Request, Response } from "express";
import wishlistService from "../services/wishlist.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const list = await wishlistService.getWishlistByUserId(userId);
  sendResponse(res, 200, true, "WISHLIST RETRIEVED SUCCESSFULLY", list);
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { productId } = req.body;
  const list = await wishlistService.addProductToWishlist(userId, productId);
  sendResponse(res, 200, true, "PRODUCT ADDED TO WISHLIST", list);
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { productId } = req.body;
  const list = await wishlistService.removeProductFromWishlist(userId, productId);
  sendResponse(res, 200, true, "PRODUCT REMOVED FROM WISHLIST", list);
});
