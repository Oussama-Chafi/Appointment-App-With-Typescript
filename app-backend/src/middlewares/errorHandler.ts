import type { NextFunction, Request, Response } from "express";

type ErrorType = Error & {
  statusCode: number;
  message: string;
};
const errorHandler = (
  err: ErrorType,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Interval Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
};

export default errorHandler;
