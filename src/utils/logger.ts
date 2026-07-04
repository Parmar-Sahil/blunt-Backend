import fs from "fs";
import path from "path";

const LOGS_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const writeLog = (level: string, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  
  // Print to stdout
  console.log(`[${level.toUpperCase()}] ${message}`, meta || "");

  // Append to local log files
  try {
    fs.appendFileSync(path.join(LOGS_DIR, `${level.toLowerCase()}.log`), logLine);
    fs.appendFileSync(path.join(LOGS_DIR, "combined.log"), logLine);
  } catch (err) {
    console.error("FAILED TO WRITE LOG TO FILE:", err);
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
