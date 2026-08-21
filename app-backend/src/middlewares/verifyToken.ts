import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import type { CustomPayload } from "../types/app.js";
import User from "../models/userSchema.js";

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeaders = req.headers.authorization || req.headers.Authorization;
  if (!(authHeaders as string).startsWith("Bearer ")) {
    throw new AppError(401, "Unthorized!");
  }
  const token = (authHeaders as string).split(" ")[1];
  jwt.verify(token!, process.env.ACCESS_TOKEN!, async (err, decoded) => {
    try {
      if (err) {
        return next(new AppError(403, "Forbidden!"));
      }
      const payload = decoded as CustomPayload;
      const currentUser = await User.findOne({
        _id: payload.userInfo.id,
      }).select("tokenVersion");
      if (
        !currentUser ||
        currentUser.tokenVersion !== payload.userInfo.tokenVersion
      ) {
        throw new AppError(
          401,
          "Session expired or logged out from all devices.",
        );
      }
      req.user = payload.userInfo;
      next();
    } catch (error) {
      next(error);
    }
  });
};

export const allowedTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role as string)) {
      throw new AppError(403, "Access denied!");
    }
    next();
  };
};
