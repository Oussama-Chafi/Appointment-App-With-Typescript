import type { NextFunction, Request, Response } from "express";
import type { ObjectSchema } from "joi";
import { AppError } from "../utils/AppError.js";

export const validateBody = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errorMessage = error.details
        .map((details) => details.message)
        .join(",");
      throw new AppError(400, errorMessage);
    }
    next();
  };
};
