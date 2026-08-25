import dotenv from "dotenv";
dotenv.config();

const rawOrigins = process.env.CLIENT_URL || "http://localhost:3000";
const allowedOrigins = rawOrigins.split(",").map((url) => url.trim()).filter(Boolean);

export const securityConfig = {
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server, health checks)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes("*") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
  },
  rateLimiter: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
};

export default securityConfig;

