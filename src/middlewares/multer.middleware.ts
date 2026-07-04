import multer from "multer";
import { Request } from "express";
import { BadRequestError } from "../utils/errors.js";

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(new BadRequestError("UNSUPPORTED FILE TYPE. ONLY JPG, JPEG, PNG, AND WEBP ARE ALLOWED."));
  }
  callback(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
});

export default upload;
