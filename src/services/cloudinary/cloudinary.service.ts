import { cloudinary } from "../../config/cloudinary.js";
import { BadRequestError, InternalServerError } from "../../utils/errors.js";

export interface ICloudinaryResponse {
  publicId: string;
  secureUrl: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  uploadedAt: Date;
}

export class CloudinaryService {
  async uploadSingle(
    fileBuffer: Buffer,
    folder: "products" | "categories" | "collections" | "admins" | "customers",
    filename?: string
  ): Promise<ICloudinaryResponse> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: `blunt/${folder}`,
        quality: "auto",
        fetch_format: "auto",
      };

      if (filename) {
        uploadOptions.public_id = filename.split(".")[0] + "_" + Date.now();
      }

      // TODO: AI Image Tagging - Auto tagging categories
      // TODO: AI Background Removal - Add background removal option
      // TODO: Image Watermark - Add logo overlay watermark
      // TODO: Image Moderation - Enable content safety checks
      // TODO: Video Upload - Configure video uploads support

      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error || !result) {
          console.error("[CLOUDINARY UPLOAD ERROR]", error);
          return reject(new InternalServerError(`CLOUDINARY UPLOAD FAILED: ${error?.message || "UNKNOWN ERROR"}`));
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          url: result.url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          uploadedAt: new Date(result.created_at),
        });
      });

      uploadStream.end(fileBuffer);
    });
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder: "products" | "categories" | "collections" | "admins" | "customers"
  ): Promise<ICloudinaryResponse[]> {
    try {
      const uploadPromises = files.map((file) => this.uploadSingle(file.buffer, folder, file.originalname));
      return await Promise.all(uploadPromises);
    } catch (e: any) {
      throw new InternalServerError(`MULTIPLE IMAGES UPLOAD FAILED: ${e.message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== "ok" && result.result !== "not found") {
        throw new Error(`Cloudinary returned status: ${result.result}`);
      }
    } catch (e: any) {
      console.error("[CLOUDINARY DELETE ERROR]", e);
      throw new InternalServerError(`CLOUDINARY IMAGE DELETION FAILED: ${e.message}`);
    }
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
