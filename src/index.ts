import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
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
app.use(helmet());
app.use(cors(securityConfig.cors));
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request tracer logging
app.use(requestLogger);

// Mount versioned V1 routes
app.use("/api/v1", v1Routes);

// Fallback legacy support for auth and admin routes if any front-end relies on them directly
// TODO: Migrate all frontend assets to /api/v1/* versioned endpoints
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Global Error Handler
app.use(errorHandler);

// Database connection & startup
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`[SERVER] CUSTOM EXPRESS AUTH SERVER RUNNING ON PORT ${PORT}`);
  });
});
