import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

export const resetPass = async (req: Request, res: Response) => {
  const resetToken = req.query.token as string;
  const { newPassword } = req.body;
  if (!resetToken || !newPassword) {
    throw new AppError(400, "Reset token and the new password are required!");
  }
  const hashResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const getUser = await User.findOne({ resetToken: hashResetToken }).exec();
  if (!getUser) {
    throw new AppError(404, "Token is not available anymore.");
  }
  if (
    !getUser.resetTokenExpiry ||
    (getUser.resetTokenExpiry as Date).getTime() < Date.now()
  ) {
    throw new AppError(400, "avalid token.");
  }
  const hashNewPassword = await bcrypt.hash(newPassword, 10);
  getUser.password = hashNewPassword;
  getUser.resetToken = null;
  getUser.resetTokenExpiry = null;
  await getUser.save();

  const user = {
    id: getUser._id,
    email: getUser.email,
    first_name: getUser.first_name,
    last_name: getUser.last_name,
    verificationTokenExpiry: getUser.verificationTokenExpiry,
    verificationToken: getUser.verificationToken,
    isVerified: getUser.isVerified,
  };

  res.status(200).json({
    success: true,
    message: "Password has been updated successfully",
    user,
  });
};
