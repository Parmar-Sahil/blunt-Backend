import { Router } from "express";
import {
  initiatePayment,
  verifyPaymentEndpoint,
  processRefundPlaceholder,
  getPaymentDetails,
  stripeWebhook,
  razorpayWebhook,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

// Public webhooks (Stripe / Razorpay verification signatures check)
router.post("/webhooks/stripe", stripeWebhook);
router.post("/webhooks/razorpay", razorpayWebhook);

// Customer protected endpoints
router.post("/create", authenticate, initiatePayment);
router.post("/verify", authenticate, verifyPaymentEndpoint);
router.post("/refund", authenticate, processRefundPlaceholder);
router.get("/:paymentId", authenticate, getPaymentDetails);

export default router;
export { router as paymentRoutes };
