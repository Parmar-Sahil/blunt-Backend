import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "./database/connection.js";
import securityConfig from "./config/security.config.js";
import requestLogger from "./middlewares/requestLogger.js";
import v1Routes from "./routes/v1.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import errorHandler from "./middlewares/errorHandler.js";
 
// Load configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & utility headers middleware
const helmetMiddleware = typeof helmet === "function" ? helmet : (helmet as any)?.default;
if (typeof helmetMiddleware === "function") {
  app.use(helmetMiddleware());
} else {
  app.use((helmet as any)());
}

app.use(cors(securityConfig.cors));
app.use(
  express.json({
    limit: "10mb",
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request tracer logging
app.use(requestLogger);

// Health check endpoints for cloud platforms (Vercel, Render, AWS, etc.) & keep-alive monitors
app.get(["/", "/health", "/api/health", "/api"], (_req: any, res: any) => {
  res.status(200).json({
    status: "ok",
    service: "blunt-backend",
    environment: process.env.NODE_ENV || "development",
    database: mongoose.connection.readyState === 1 ? "connected" : "connecting",
    timestamp: new Date().toISOString(),
  });
});

// Mount auth/admin routes BEFORE the DB guard so token refresh always works
// even while MongoDB is still connecting on startup
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

// DB readiness guard — ensure MongoDB is connected before handling data routes
app.use(async (req: any, res: any, next: any) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDatabase();
    } catch (err: any) {
      console.error("[DB] Error connecting on-demand:", err?.message || err);
      return res.status(503).json({
        success: false,
        message: "DATABASE CONNECTION NOT READY. PLEASE RETRY IN A MOMENT.",
        data: null,
        error: err?.message || "ServiceUnavailable",
      });
    }
  }
  next();
});

// Mount versioned V1 routes
app.use("/api/v1", v1Routes);
app.use("/v1", v1Routes);

// Global Error Handler
app.use(errorHandler);

// Establish database connection with retry logic (for standalone node / local dev)
const connectWithRetry = async (attempt = 1): Promise<void> => {
  try {
    await connectDatabase();
  } catch (err: any) {
    const delay = Math.min(5000 * attempt, 30000);
    console.error(`[SERVER] DB CONNECTION ATTEMPT ${attempt} FAILED. RETRYING IN ${delay / 1000}s...`);
    setTimeout(() => connectWithRetry(attempt + 1), delay);
  }
};

// Start standalone HTTP server unless running in a serverless environment (like Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[SERVER] CUSTOM EXPRESS AUTH SERVER RUNNING ON PORT ${PORT}`);
  });
  connectWithRetry();
}

export default app;


