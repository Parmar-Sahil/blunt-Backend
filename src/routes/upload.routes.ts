import { Router } from "express";
import {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  reorderImagesEndpoint,
  setThumbnailEndpoint,
} from "../controllers/upload.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  authenticateAdmin,
  authorizeAdmin,
  requireRole,
} from "../middlewares/admin-auth.middleware.js";

const router = Router();

router.use(authenticateAdmin);
router.use(authorizeAdmin);
router.use(requireRole(["superadmin", "admin"]));

router.post("/image", upload.single("image"), uploadSingleImage);
router.post("/images", upload.array("images", 10), uploadMultipleImages);
router.delete("/:publicId(*)", deleteImage);
router.patch("/reorder", reorderImagesEndpoint);
router.patch("/thumbnail", setThumbnailEndpoint);

export default router;
export { router as uploadRoutes };
