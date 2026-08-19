import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";

export const verifyEmail = async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    throw new AppError(400, "token is required.");
  }
  const getUser = await User.findOne({ verificationToken: token }).exec();
  if (!getUser) {
    throw new AppError(404, "invalid token!");
  }
  if (
    !getUser.verificationTokenExpiry ||
    (getUser.verificationTokenExpiry as Date).getTime() < Date.now()
  ) {
    throw new AppError(400, "token has been expired!");
  }
  await User.findByIdAndUpdate(getUser._id, {
    verificationToken: null,
    verificationTokenExpiry: null,
    isVerified: true,
  });
  res.status(200).json({
    success: true,
    message: "Your account is verified successfully. You can log in now",
  });
};
