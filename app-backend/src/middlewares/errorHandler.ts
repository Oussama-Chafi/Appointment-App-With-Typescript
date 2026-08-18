import type { NextFunction, Request, Response } from "express";

type ErrorType = Error & {
  statusCode: number;
  message: string;
  name?: string;
  code?: number;
};
const errorHandler = (
  err: ErrorType,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Interval Server Error";
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid Resource ID format";
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered.";
  }
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
};

export default errorHandler;
