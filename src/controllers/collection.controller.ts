import { Request, Response } from "express";
import collectionService from "../services/collection.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { BadRequestError } from "../utils/errors.js";

export const getCollections = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const status = req.query.status as string;
  const isFeatured = req.query.isFeatured !== undefined ? req.query.isFeatured === "true" : undefined;
  const sortBy = req.query.sortBy as string;
  const includeArchived = req.query.includeArchived === "true";

  const result = await collectionService.listPaginated({
    page,
    limit,
    search,
    status,
    isFeatured,
    sortBy,
    includeArchived,
  });

  sendResponse(res, 200, true, "COLLECTIONS RETRIEVED SUCCESSFULLY", result);
});

export const getCollectionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID COLLECTION OBJECTID");
  }

  const collection = await collectionService.getCollectionById(id);
  sendResponse(res, 200, true, "COLLECTION RETRIEVED SUCCESSFULLY", collection);
});

export const getCollectionBySlug = asyncHandler(async (req: Request, res: Response) => {
  const collection = await collectionService.getCollectionBySlug(req.params.slug);
  sendResponse(res, 200, true, "COLLECTION RETRIEVED SUCCESSFULLY", collection);
});

export const createCollection = asyncHandler(async (req: Request, res: Response) => {
  const actorId = (req as any).user?.userId || "system";
  const collection = await collectionService.createCollection({ ...req.body, actorId });
  sendResponse(res, 201, true, "COLLECTION CREATED SUCCESSFULLY", collection);
});

export const updateCollection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID COLLECTION OBJECTID");
  }

  const actorId = (req as any).user?.userId || "system";
  const collection = await collectionService.updateCollection(id, { ...req.body, actorId });
  sendResponse(res, 200, true, "COLLECTION UPDATED SUCCESSFULLY", collection);
});

export const archiveCollection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID COLLECTION OBJECTID");
  }

  const actorId = (req as any).user?.userId || "system";
  const collection = await collectionService.archiveCollection(id, actorId);
  sendResponse(res, 200, true, "COLLECTION ARCHIVED SUCCESSFULLY", collection);
});

export const restoreCollection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID COLLECTION OBJECTID");
  }

  const collection = await collectionService.restoreCollection(id);
  sendResponse(res, 200, true, "COLLECTION RESTORED SUCCESSFULLY", collection);
});

export const deleteCollection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID COLLECTION OBJECTID");
  }

  await collectionService.deleteCollection(id);
  sendResponse(res, 200, true, "COLLECTION DELETED PERMANENTLY");
});
