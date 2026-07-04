import { Request, Response } from "express";
import cloudinaryService from "../services/cloudinary/cloudinary.service.js";
import productRepository from "../repositories/product.repository.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { reorderImages, setThumbnail } from "../utils/image.utils.js";

export const uploadSingleImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new BadRequestError("NO FILE ATTACHED");
  }

  const folder = (req.body.folder as any) || "products";
  const result = await cloudinaryService.uploadSingle(req.file.buffer, folder, req.file.originalname);
  
  sendResponse(res, 201, true, "IMAGE UPLOADED SUCCESSFULLY", result);
});

export const uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new BadRequestError("NO FILES ATTACHED");
  }
  if (files.length > 10) {
    throw new BadRequestError("MAXIMUM 10 IMAGES CAN BE UPLOADED AT ONCE");
  }

  const folder = (req.body.folder as any) || "products";
  const results = await cloudinaryService.uploadMultiple(files, folder);

  sendResponse(res, 201, true, "IMAGES UPLOADED SUCCESSFULLY", results);
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.params;
  if (!publicId) {
    throw new BadRequestError("PUBLIC ID IS REQUIRED");
  }

  await cloudinaryService.deleteImage(publicId);
  sendResponse(res, 200, true, "IMAGE DELETED FROM CLOUDINARY SUCCESSFULLY");
});

export const reorderImagesEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { productId, publicIdOrder } = req.body;
  if (!productId || !Array.isArray(publicIdOrder)) {
    throw new BadRequestError("PRODUCT ID AND PUBLIC ID ORDER ARRAY ARE REQUIRED");
  }

  const product = await productRepository.findById(productId);
  if (!product) throw new NotFoundError("PRODUCT NOT FOUND");

  product.images = reorderImages(product.images, publicIdOrder);
  await product.save();

  sendResponse(res, 200, true, "PRODUCT IMAGES REORDERED SUCCESSFULLY", product.images);
});

export const setThumbnailEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { productId, publicId } = req.body;
  if (!productId || !publicId) {
    throw new BadRequestError("PRODUCT ID AND PUBLIC ID OF THUMBNAIL ARE REQUIRED");
  }

  const product = await productRepository.findById(productId);
  if (!product) throw new NotFoundError("PRODUCT NOT FOUND");

  product.images = setThumbnail(product.images, publicId);
  
  const selectedImage = product.images.find((img) => img.publicId === publicId);
  if (selectedImage) {
    product.thumbnail = selectedImage.url;
  }
  
  await product.save();

  sendResponse(res, 200, true, "PRODUCT THUMBNAIL UPDATED SUCCESSFULLY", {
    images: product.images,
    thumbnail: product.thumbnail,
  });
});
