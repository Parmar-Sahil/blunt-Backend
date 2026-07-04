import { Router } from "express";
import {
  initiateCheckout,
  getCheckout,
  cancelCheckout,
} from "../controllers/checkout.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import validateRequest from "../middlewares/validation.js";
import { checkoutSessionSchema } from "../validators/checkout.schema.js";

const router = Router();

// Secure all checkout endpoints with authenticated customers check
router.use(authenticate);

router.post("/", validateRequest(checkoutSessionSchema), initiateCheckout);
router.get("/:checkoutId", getCheckout);
router.delete("/:checkoutId", cancelCheckout);

export default router;
export { router as checkoutRoutes };
