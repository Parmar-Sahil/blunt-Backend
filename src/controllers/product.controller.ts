import { Request, Response } from "express";
import productService from "../services/product.service.js";
import cloudinaryService from "../services/cloudinary/cloudinary.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { BadRequestError } from "../utils/errors.js";

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const categoryId = req.query.categoryId as string;
  const collectionId = req.query.collectionId as string;
  const status = req.query.status as string;
  const visibility = req.query.visibility as string;
  const color = req.query.color as string;
  const size = req.query.size as string;
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
  const availability = req.query.availability !== undefined ? req.query.availability === "true" : undefined;
  const sortBy = req.query.sortBy as string;
  const includeArchived = req.query.includeArchived === "true";
  const fields = req.query.fields as string;

  const labels = req.query.labels ? (req.query.labels as string).split(",") : undefined;

  const result = await productService.listPaginated({
    page,
    limit,
    search,
    categoryId,
    collectionId,
    labels,
    status,
    visibility,
    color,
    size,
    minPrice,
    maxPrice,
    availability,
    sortBy,
    includeArchived,
    fields,
  });

  sendResponse(res, 200, true, "PRODUCTS RETRIEVED SUCCESSFULLY", result);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID PRODUCT OBJECTID");
  }

  const product = await productService.getProductById(id);
  sendResponse(res, 200, true, "PRODUCT RETRIEVED SUCCESSFULLY", product);
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductBySlug(req.params.slug);
  sendResponse(res, 200, true, "PRODUCT RETRIEVED SUCCESSFULLY", product);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const actorId = (req as any).user?.userId || "system";
  const files = req.files as Express.Multer.File[];
  
  let uploadedImages: any[] = [];
  try {
    if (files && files.length > 0) {
      const cloudinaryResults = await cloudinaryService.uploadMultiple(files, "products");
      uploadedImages = cloudinaryResults.map((res, index) => ({
        publicId: res.publicId,
        url: res.secureUrl,
        alt: req.body.alt || "",
        isThumbnail: index === 0,
        sortOrder: index,
      }));
      req.body.images = [...(req.body.images || []), ...uploadedImages];
      if (!req.body.thumbnail && uploadedImages.length > 0) {
        req.body.thumbnail = uploadedImages[0].url;
      }
    }

    const product = await productService.createProduct({ ...req.body, actorId });
    sendResponse(res, 201, true, "PRODUCT CREATED SUCCESSFULLY", product);
  } catch (error) {
    if (uploadedImages.length > 0) {
      console.warn("[ROLLBACK] CLEANING UP UPLOADED IMAGES ON FAILURE...");
      await Promise.all(uploadedImages.map((img) => cloudinaryService.deleteImage(img.publicId)));
    }
    throw error;
  }
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID PRODUCT OBJECTID");
  }

  const actorId = (req as any).user?.userId || "system";
  const files = req.files as Express.Multer.File[];
  
  let uploadedImages: any[] = [];
  try {
    if (files && files.length > 0) {
      const cloudinaryResults = await cloudinaryService.uploadMultiple(files, "products");
      uploadedImages = cloudinaryResults.map((res, index) => ({
        publicId: res.publicId,
        url: res.secureUrl,
        alt: req.body.alt || "",
        isThumbnail: false,
        sortOrder: index + 100,
      }));
      req.body.images = [...(req.body.images || []), ...uploadedImages];
    }

    const product = await productService.updateProduct(id, { ...req.body, actorId });
    sendResponse(res, 200, true, "PRODUCT UPDATED SUCCESSFULLY", product);
  } catch (error) {
    if (uploadedImages.length > 0) {
      console.warn("[ROLLBACK] CLEANING UP UPLOADED IMAGES ON FAILURE...");
      await Promise.all(uploadedImages.map((img) => cloudinaryService.deleteImage(img.publicId)));
    }
    throw error;
  }
});

export const duplicateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID PRODUCT OBJECTID");
  }

  const actorId = (req as any).user?.userId || "system";
  const product = await productService.duplicateProduct(id, actorId);
  sendResponse(res, 201, true, "PRODUCT DUPLICATED SUCCESSFULLY", product);
});

export const archiveProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID PRODUCT OBJECTID");
  }

  const actorId = (req as any).user?.userId || "system";
  const product = await productService.archiveProduct(id, actorId);
  sendResponse(res, 200, true, "PRODUCT ARCHIVED SUCCESSFULLY", product);
});

export const restoreProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID PRODUCT OBJECTID");
  }

  const product = await productService.restoreProduct(id);
  sendResponse(res, 200, true, "PRODUCT RESTORED SUCCESSFULLY", product);
});

export const publishProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID PRODUCT OBJECTID");
  }

  const actorId = (req as any).user?.userId || "system";
  const product = await productService.publishProduct(id, actorId);
  sendResponse(res, 200, true, "PRODUCT PUBLISHED SUCCESSFULLY", product);
});

export const unpublishProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID PRODUCT OBJECTID");
  }

  const actorId = (req as any).user?.userId || "system";
  const product = await productService.unpublishProduct(id, actorId);
  sendResponse(res, 200, true, "PRODUCT UNPUBLISHED SUCCESSFULLY", product);
});

export const updateLabels = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID PRODUCT OBJECTID");
  }

  const { labels } = req.body;
  if (!Array.isArray(labels)) {
    throw new BadRequestError("LABELS MUST BE AN ARRAY");
  }

  const actorId = (req as any).user?.userId || "system";
  const product = await productService.updateLabels(id, labels, actorId);
  sendResponse(res, 200, true, "PRODUCT LABELS UPDATED SUCCESSFULLY", product);
});

export const updatePriority = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID PRODUCT OBJECTID");
  }

  const { displayPriority } = req.body;
  if (typeof displayPriority !== "number") {
    throw new BadRequestError("DISPLAY PRIORITY MUST BE A NUMBER");
  }

  const actorId = (req as any).user?.userId || "system";
  const product = await productService.updatePriority(id, displayPriority, actorId);
  sendResponse(res, 200, true, "PRODUCT DISPLAY PRIORITY UPDATED SUCCESSFULLY", product);
});

export const addImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID PRODUCT OBJECTID");
  }

  const product = await productService.addImage(id, req.body);
  sendResponse(res, 200, true, "PRODUCT IMAGE ADDED SUCCESSFULLY", product);
});

export const removeImage = asyncHandler(async (req: Request, res: Response) => {
  const { id, imageId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(imageId)) {
    throw new BadRequestError("INVALID OBJECTID");
  }

  const product = await productService.removeImage(id, imageId);
  sendResponse(res, 200, true, "PRODUCT IMAGE REMOVED SUCCESSFULLY", product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("INVALID PRODUCT OBJECTID");
  }

  await productService.deleteProduct(id);
  sendResponse(res, 200, true, "PRODUCT DELETED PERMANENTLY");
});
