import { Request, Response } from "express";
import categoryService from "../services/category.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { BadRequestError } from "../utils/errors.js";

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const status = req.query.status as string;
  const isFeatured = req.query.isFeatured !== undefined ? req.query.isFeatured === "true" : undefined;
  const sortBy = req.query.sortBy as string;
  const includeArchived = req.query.includeArchived === "true";

  const result = await categoryService.listPaginated({
    page,
    limit,
    search,
    status,
    isFeatured,
    sortBy,
    includeArchived,
  });

  sendResponse(res, 200, true, "CATEGORIES RETRIEVED SUCCESSFULLY", result);
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID CATEGORY OBJECTID");
  }

  const category = await categoryService.getCategoryById(id);
  sendResponse(res, 200, true, "CATEGORY RETRIEVED SUCCESSFULLY", category);
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  sendResponse(res, 200, true, "CATEGORY RETRIEVED SUCCESSFULLY", category);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const actorId = (req as any).user?.userId || "system";
  const category = await categoryService.createCategory({ ...req.body, actorId });
  sendResponse(res, 201, true, "CATEGORY CREATED SUCCESSFULLY", category);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID CATEGORY OBJECTID");
  }

  const actorId = (req as any).user?.userId || "system";
  const category = await categoryService.updateCategory(id, { ...req.body, actorId });
  sendResponse(res, 200, true, "CATEGORY UPDATED SUCCESSFULLY", category);
});

export const archiveCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID CATEGORY OBJECTID");
  }

  const actorId = (req as any).user?.userId || "system";
  const category = await categoryService.archiveCategory(id, actorId);
  sendResponse(res, 200, true, "CATEGORY ARCHIVED SUCCESSFULLY", category);
});

export const restoreCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID CATEGORY OBJECTID");
  }

  const category = await categoryService.restoreCategory(id);
  sendResponse(res, 200, true, "CATEGORY RESTORED SUCCESSFULLY", category);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID CATEGORY OBJECTID");
  }

  await categoryService.deleteCategory(id);
  sendResponse(res, 200, true, "CATEGORY DELETED PERMANENTLY");
});
