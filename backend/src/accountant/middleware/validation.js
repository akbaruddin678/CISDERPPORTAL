import { AppError } from "./errorHandler.js";
import mongoose from "mongoose";

export const requireFields = (fields) => (req, res, next) => {
  const missing = fields.filter((field) => !req.body[field]);
  if (missing.length > 0) {
    return next(new AppError(`Missing required fields: ${missing.join(", ")}`, 400));
  }
  next();
};

export const validateObjectIds = (paramName) => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return next(new AppError(`Invalid ${paramName}`, 400));
  }
  next();
};