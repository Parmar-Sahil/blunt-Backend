import { Router } from "express";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import productRoutes from "./product.routes.js";
import categoryRoutes from "./category.routes.js";
import collectionRoutes from "./collection.routes.js";
import orderRoutes from "./order.routes.js";
import cartRoutes from "./cart.routes.js";
import wishlistRoutes from "./wishlist.routes.js";
import addressRoutes from "./address.routes.js";
import paymentRoutes from "./payment.routes.js";
import uploadRoutes from "./upload.routes.js";
import checkoutRoutes from "./checkout.routes.js";
import notificationRoutes from "./notification.routes.js";
import { returnRoutes, adminReturnRoutes } from "./return.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/collections", collectionRoutes);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/addresses", addressRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin/upload", uploadRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/notifications", notificationRoutes);
router.use("/returns", returnRoutes);
router.use("/admin/returns", adminReturnRoutes);

export default router;
