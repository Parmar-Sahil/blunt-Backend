import { Request, Response } from "express";
import dropService from "../services/drop.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";
import { toPublicProductDto } from "../dtos/product.dto.js";

/**
 * Format drop output to public DTO
 */
function formatDropDto(drop: any) {
  if (!drop) return null;
  const rawObj = drop.toObject ? drop.toObject() : drop;

  const populatedProducts = Array.isArray(rawObj.productIds)
    ? rawObj.productIds
        .filter((p: any) => p && typeof p === "object")
        .map((p: any) => toPublicProductDto(p))
    : [];

  const dropNum = rawObj.dropNumber ?? 1;
  const formattedDropNum =
    rawObj.formattedDropNumber ||
    (dropNum < 10 ? `00${dropNum}` : dropNum < 100 ? `0${dropNum}` : `${dropNum}`);
  const displayNum = rawObj.displayNumber || `DROP ${formattedDropNum}`;

  return {
    id: rawObj._id,
    dropNumber: dropNum,
    displayNumber: displayNum,
    formattedDropNumber: formattedDropNum,
    name: rawObj.name || `Drop ${formattedDropNum}`,
    title: rawObj.title,
    slug: rawObj.slug,
    subtitle: rawObj.subtitle || "",
    description: rawObj.description || "",
    heroImage: rawObj.heroImage,
    galleryImages: rawObj.galleryImages || rawObj.secondaryImages || [],
    releaseDate: rawObj.releaseDate,
    status: rawObj.status,
    isLatest: rawObj.isLatest,
    products: populatedProducts,
    productIds: Array.isArray(rawObj.productIds)
      ? rawObj.productIds.map((p: any) => (p._id ? p._id.toString() : p.toString()))
      : [],
    createdAt: rawObj.createdAt,
    updatedAt: rawObj.updatedAt,
  };
}

export const getNextDropNumber = asyncHandler(async (req: Request, res: Response) => {
  const result = await dropService.getNextDropNumber();
  return sendResponse(res, 200, true, "NEXT DROP NUMBER GENERATED", result);
});

export const getLatestDrop = asyncHandler(async (req: Request, res: Response) => {
  const drop = await dropService.getLatestDrop();
  if (!drop) {
    return sendResponse(res, 200, true, "NO ACTIVE DROP FOUND", null);
  }
  return sendResponse(res, 200, true, "LATEST DROP RETRIEVED SUCCESSFULLY", formatDropDto(drop));
});

export const getAllDrops = asyncHandler(async (req: Request, res: Response) => {
  const result = await dropService.getAllDrops(req.query);
  const items = result.items.map((drop) => formatDropDto(drop));
  return sendResponse(res, 200, true, "DROPS RETRIEVED SUCCESSFULLY", {
    items,
    total: result.total,
  });
});

export const getDropById = asyncHandler(async (req: Request, res: Response) => {
  const drop = await dropService.getDropById(req.params.id);
  if (!drop) {
    return sendResponse(res, 404, false, "DROP NOT FOUND", null);
  }
  return sendResponse(res, 200, true, "DROP RETRIEVED SUCCESSFULLY", formatDropDto(drop));
});

export const createDrop = asyncHandler(async (req: Request, res: Response) => {
  const actorId = (req as any).user?.userId || (req as any).admin?.id || "system";
  const drop = await dropService.createDrop({
    ...req.body,
    createdBy: actorId,
    updatedBy: actorId,
  });
  return sendResponse(res, 201, true, "DROP CREATED SUCCESSFULLY", formatDropDto(drop));
});

export const updateDrop = asyncHandler(async (req: Request, res: Response) => {
  const actorId = (req as any).user?.userId || (req as any).admin?.id || "system";
  const drop = await dropService.updateDrop(req.params.id, {
    ...req.body,
    updatedBy: actorId,
  });
  return sendResponse(res, 200, true, "DROP UPDATED SUCCESSFULLY", formatDropDto(drop));
});

export const activateDrop = asyncHandler(async (req: Request, res: Response) => {
  const drop = await dropService.activateDrop(req.params.id);
  return sendResponse(res, 200, true, `DROP ${drop.displayNumber} ACTIVATED AS LATEST`, formatDropDto(drop));
});

export const archiveDrop = asyncHandler(async (req: Request, res: Response) => {
  const drop = await dropService.archiveDrop(req.params.id);
  return sendResponse(res, 200, true, `DROP ${drop.displayNumber} ARCHIVED`, formatDropDto(drop));
});

export const deleteDrop = asyncHandler(async (req: Request, res: Response) => {
  await dropService.deleteDrop(req.params.id);
  return sendResponse(res, 200, true, "DROP REMOVED SUCCESSFULLY", null);
});
