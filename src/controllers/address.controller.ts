import { Request, Response } from "express";
import addressService from "../services/address.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId || (req as any).user?.id;
  const list = await addressService.listUserAddresses(userId);
  sendResponse(res, 200, true, "ADDRESSES RETRIEVED SUCCESSFULLY", list);
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId || (req as any).user?.id;
  const address = await addressService.createAddress({ ...req.body, user: userId });
  sendResponse(res, 201, true, "ADDRESS CREATED SUCCESSFULLY", address);
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.updateAddress(req.params.id, req.body);
  sendResponse(res, 200, true, "ADDRESS UPDATED SUCCESSFULLY", address);
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  await addressService.deleteAddress(req.params.id);
  sendResponse(res, 200, true, "ADDRESS DELETED SUCCESSFULLY");
});
