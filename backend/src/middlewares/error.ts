import { Request, Response, NextFunction } from "express";
import FIELD_LABELS from "models/shared/FIELD_LABELS";
import { existsSync, unlink } from "fs";
import logger from "utils/logger";
import config from "config";
// Custom error class
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: Record<string, any>;

  constructor(message: string, statusCode: number, errors?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not Found middleware
const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

// Global error handler
const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  console.log('\x1b[31m%s\x1b[0m', `[ERROR] URL: ${req.url}`, err);
  logger.error(`${err.message} - ${req.method} ${req.originalUrl} - ${req.ip}`);
  logger.error(err.stack);
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  // Switch on true to allow conditional cases
  switch (true) {
     
    // 1️⃣ Yup validation error
    case err.name === "ValidationError" && Array.isArray(err.errors) && !err.errors[0]?.path:
      statusCode = 400;
      message = err.errors.join(", ");
      break;

    // 2️⃣ Mongoose validation error
    case err.name === "ValidationError" && !!err.errors:
      statusCode = 400;
      message = Object.values(err.errors)
        .map((val: any) => val.message)
        .join(", ");
      break;

    // 3️⃣ Mongoose cast error
    case err.name === "CastError":
      statusCode = 400;
      message = `Invalid ${err.path}: ${err.value}`;
      break;

    // 4️⃣ Mongo duplicate key error
    case err.code === 11000:
      statusCode = 400;
      // Get all duplicate keys
      let duplicateKeys = Object.keys(err.keyValue);
      const keysToRemove = ["vendorId", "companyId", "customerId"];

      // Filter out internal keys if there are other duplicate keys to show
      if (duplicateKeys.length > 1) {
        const filteredKeys = duplicateKeys.filter(key => !keysToRemove.includes(key));
        if (filteredKeys.length > 0) {
          duplicateKeys = filteredKeys;
        }
      }

      // Map to user-friendly labels
      const duplicateLabels = duplicateKeys.map(key => FIELD_LABELS[key] || key).join(", ");

      message = `${duplicateLabels} already exists.`;
      break;

    // 5️⃣ JWT errors
    case err.name === "JsonWebTokenError":
      statusCode = 401;
      message = "Invalid token, please log in again";
      break;
    case err.name === "TokenExpiredError":
      statusCode = 401;
      message = "Token expired, please log in again";
      break;

    // 6️⃣ Syntax error (malformed JSON)
    case err.name === "SyntaxError":
      statusCode = 400;
      message = "Malformed JSON request";
      break;

    // 7️⃣ Database connection refused
    case err.code === "ECONNREFUSED":
      statusCode = 503;
      message = "Database connection refused";
      break;

    // 8️⃣ Resource not found
    case err.code === "ENOTFOUND":
      statusCode = 404;
      message = "Resource not found";
      break;

    // 9️⃣ Default (any other error)
    default:
      statusCode = err.statusCode || 500;
      message = err.message || "Internal Server Error";
  }
  // Delete uploaded files on error
  if (req.files) {
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    files.forEach((file: Express.Multer.File) => {
      if (file.path && existsSync(file.path)) {
        unlink(file.path, () => {});
      }
    });
  }
  if (req.file?.path && existsSync(req.file.path)) {
    unlink(req.file.path, () => {});
  }
  

   
  res.status(statusCode).json({
    success: false,
    message,
    error: config.NODE_ENV === "production" || config.NODE_ENV ==="staging"  ? undefined : err.stack
  });
};


export { notFound, errorHandler, AppError };
