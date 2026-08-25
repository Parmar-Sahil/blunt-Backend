import fs from "fs";
import path from "path";

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const LOGS_DIR = path.join(process.cwd(), "logs");

const ensureLogsDir = () => {
  if (isServerless) return false;
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
};

const writeLog = (level: string, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | Meta: ${typeof meta === "object" ? JSON.stringify(meta) : meta}` : "";
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;

  // Always output to stdout/stderr (standard for cloud logs)
  if (level === "error") {
    console.error(`[ERROR] ${message}`, meta || "");
  } else if (level === "warn") {
    console.warn(`[WARN] ${message}`, meta || "");
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, meta || "");
  }

  // Only append to local log files in standalone/local environments
  if (!isServerless && ensureLogsDir()) {
    try {
      fs.appendFileSync(path.join(LOGS_DIR, `${level.toLowerCase()}.log`), logLine);
      fs.appendFileSync(path.join(LOGS_DIR, "combined.log"), logLine);
    } catch {
      // Ignore file writing errors gracefully
    }
  }
};

export const logger = {
  info(message: string, meta?: any) {
    writeLog("info", message, meta);
  },
  warn(message: string, meta?: any) {
    writeLog("warn", message, meta);
  },
  error(message: string, meta?: any) {
    writeLog("error", message, meta);
  },
  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV !== "production") {
      writeLog("debug", message, meta);
    }
  },
};

export default logger;
