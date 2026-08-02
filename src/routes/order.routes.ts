import { Router } from "express";
import {
  placeOrder,
  getCustomerOrdersList,
  getCustomerOrderDetails,
  cancelCustomerOrder,
} from "../controllers/order.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

// Secure all customer order paths
router.use(authenticate);

router.post("/", placeOrder);
router.get("/", getCustomerOrdersList);
router.get("/:id", getCustomerOrderDetails);
router.patch("/:id/cancel", cancelCustomerOrder);

export default router;
export { router as orderRoutes };
