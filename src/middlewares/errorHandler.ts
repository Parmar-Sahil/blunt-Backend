import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || "INTERNAL SERVER ERROR";

  console.error(`[ERROR EXCEPTION] [${req.method} ${req.url}]:`, {
    message,
    statusCode,
    error: err.name,
    stack: err.stack, // Log internally
  });

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: err.name || "AppError",
  });
};
export default errorHandler;
