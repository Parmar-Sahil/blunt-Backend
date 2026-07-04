import { Router } from "express";
import { adminController } from "../controllers/admin.controller.js";
import {
  authenticateAdmin,
  authorizeAdmin,
  requireRole,
  requirePermission,
} from "../middlewares/admin-auth.middleware.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

// Categories & Collections controllers
import {
  createCategory,
  updateCategory,
  archiveCategory,
  restoreCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import {
  createCollection,
  updateCollection,
  archiveCollection,
  restoreCollection,
  deleteCollection,
} from "../controllers/collection.controller.js";

// Products controllers
import {
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  deleteProduct,
  publishProduct,
  unpublishProduct,
  updateLabels,
  updatePriority,
  addImage,
  removeImage,
  duplicateProduct,
} from "../controllers/product.controller.js";

// Orders controllers
import {
  getAdminOrdersList,
  getAdminOrderDetails,
  adminUpdateStatus,
  adminUpdateShipping,
  adminUpdatePayment,
  adminUpdateNotes,
} from "../controllers/order.controller.js";

// Payments controllers
import { getAdminPaymentsList } from "../controllers/payment.controller.js";

// Notifications controllers
import { getAdminNotificationsList } from "../controllers/notification.controller.js";

// Zod schemas & validator middleware
import { categoryCreateSchema, categoryUpdateSchema } from "../validators/category.schema.js";
import { collectionCreateSchema, collectionUpdateSchema } from "../validators/collection.schema.js";
import { upload } from "../middlewares/multer.middleware.js";
import { productCreateSchema, productUpdateSchema } from "../validators/product.schema.js";
import validateRequest from "../middlewares/validation.js";

const router = Router();

const loginLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: "TOO MANY ADMINISTRATIVE LOGIN ATTEMPTS. ACCESS LOCKED.",
});

const otpLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: "TOO MANY 2FA VERIFICATION CODE REQUESTS.",
});

// Admin auth session operations
router.post("/login", loginLimiter, (req, res, next) => adminController.login(req, res, next));
router.post("/verify-otp", otpLimiter, (req, res, next) => adminController.verifyOtp(req, res, next));
router.post("/logout", (req, res, next) => adminController.logout(req, res, next));
router.post("/refresh", (req, res, next) => adminController.refresh(req, res, next));
router.get("/me", authenticateAdmin, authorizeAdmin, (req, res, next) => adminController.me(req, res, next));

// Admin account CRUD operations
router.get(
  "/admins",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  (req, res, next) => adminController.getAdmins(req, res, next)
);

router.post(
  "/admins",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin"]),
  (req, res, next) => adminController.createAdmin(req, res, next)
);

router.put(
  "/admins/:id",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin"]),
  (req, res, next) => adminController.updateAdmin(req, res, next)
);

router.delete(
  "/admins/:id",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin"]),
  (req, res, next) => adminController.deleteAdmin(req, res, next)
);

router.patch(
  "/admins/:id/status",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin"]),
  (req, res, next) => adminController.updateAdminStatus(req, res, next)
);

// Admin Category operations
router.post(
  "/categories",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  validateRequest(categoryCreateSchema),
  createCategory
);

router.put(
  "/categories/:id",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  validateRequest(categoryUpdateSchema),
  updateCategory
);

router.patch(
  "/categories/:id/archive",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  archiveCategory
);

router.patch(
  "/categories/:id/restore",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  restoreCategory
);

router.delete(
  "/categories/:id",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  deleteCategory
);

// Admin Collection operations
router.post(
  "/collections",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  validateRequest(collectionCreateSchema),
  createCollection
);

router.put(
  "/collections/:id",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  validateRequest(collectionUpdateSchema),
  updateCollection
);

router.patch(
  "/collections/:id/archive",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  archiveCollection
);

router.patch(
  "/collections/:id/restore",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  restoreCollection
);

router.delete(
  "/collections/:id",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  deleteCollection
);

// Admin Product operations
router.post(
  "/products",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  upload.array("images", 10),
  (req, res, next) => {
    if (req.body.data) {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (e) {
        // ignore
      }
    }
    next();
  },
  validateRequest(productCreateSchema),
  createProduct
);

router.put(
  "/products/:id",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  upload.array("images", 10),
  (req, res, next) => {
    if (req.body.data) {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (e) {
        // ignore
      }
    }
    next();
  },
  validateRequest(productUpdateSchema),
  updateProduct
);

router.delete(
  "/products/:id",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  deleteProduct
);

router.post(
  "/products/:id/duplicate",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  duplicateProduct
);

router.patch(
  "/products/:id/publish",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  publishProduct
);

router.patch(
  "/products/:id/unpublish",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  unpublishProduct
);

router.patch(
  "/products/:id/archive",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  archiveProduct
);

router.patch(
  "/products/:id/restore",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  restoreProduct
);

router.patch(
  "/products/:id/labels",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  updateLabels
);

router.patch(
  "/products/:id/priority",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  updatePriority
);

router.post(
  "/products/:id/images",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  addImage
);

router.delete(
  "/products/:id/images/:imageId",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  removeImage
);

// Admin Order operations
router.get(
  "/orders",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  getAdminOrdersList
);

router.get(
  "/orders/:id",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  getAdminOrderDetails
);

router.patch(
  "/orders/:id/status",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  adminUpdateStatus
);

router.patch(
  "/orders/:id/shipping",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  adminUpdateShipping
);

router.patch(
  "/orders/:id/payment",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  adminUpdatePayment
);

router.patch(
  "/orders/:id/notes",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  adminUpdateNotes
);

router.get(
  "/payments",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  getAdminPaymentsList
);

router.get(
  "/notifications",
  authenticateAdmin,
  authorizeAdmin,
  requireRole(["superadmin", "admin"]),
  getAdminNotificationsList
);

export default router;
