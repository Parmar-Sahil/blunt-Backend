import { Router } from "express";
import { testEmail } from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

const emailTestLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "TOO MANY TEST EMAIL ATTEMPTS. ACCESS TIED FOR 15 MINUTES.",
});

router.post("/test-email", authenticate, emailTestLimiter, testEmail);

export default router;
export { router as notificationRoutes };
