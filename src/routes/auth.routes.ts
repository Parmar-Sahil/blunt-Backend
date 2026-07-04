import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// Rate limiter instances for secure access controls
const loginLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: "TOO MANY LOGIN ATTEMPTS.",
});

const registerLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: "TOO MANY REGISTRATION ATTEMPTS.",
});

const otpLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: "TOO MANY OTP REQUESTS.",
});

const passwordResetLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: "TOO MANY PASSWORD RESET REQUESTS.",
});

// Registration flow
router.post("/register", registerLimiter, (req, res, next) => authController.register(req, res, next));
router.post("/verify-registration", otpLimiter, (req, res, next) => authController.verifyRegistrationOtp(req, res, next));
router.post("/verify-registration-otp", otpLimiter, (req, res, next) => authController.verifyRegistrationOtp(req, res, next));

// Login flow
router.post("/login", loginLimiter, (req, res, next) => authController.login(req, res, next));
router.post("/verify-login", otpLimiter, (req, res, next) => authController.verifyLoginOtp(req, res, next));
router.post("/verify-login-otp", otpLimiter, (req, res, next) => authController.verifyLoginOtp(req, res, next));
router.post("/admin-login", loginLimiter, (req, res, next) => authController.adminLogin(req, res, next));
router.post("/admin-verify-otp", otpLimiter, (req, res, next) => authController.verifyAdminOtp(req, res, next));

// Resend OTP code
router.post("/resend-otp", otpLimiter, (req, res, next) => authController.resendOtp(req, res, next));

// Password recovery flow
router.post("/forgot-password", passwordResetLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
router.post("/verify-reset-otp", otpLimiter, (req, res, next) => authController.verifyResetOtp(req, res, next));
router.post("/reset-password", passwordResetLimiter, (req, res, next) => authController.resetPassword(req, res, next));
router.post("/change-password", authenticate, passwordResetLimiter, (req, res, next) => authController.changePassword(req, res, next));

// Token refresh & logout (cookie based)
router.post("/refresh", (req, res, next) => authController.refresh(req, res, next));
router.post("/logout", (req, res, next) => authController.logout(req, res, next));

// Authenticated user profile context
router.get("/me", authenticate, (req, res, next) => authController.me(req, res, next));

export default router;
