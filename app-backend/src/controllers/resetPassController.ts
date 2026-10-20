import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Verify the reset token and change the password
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           example: "6aa9d8cf51da0972b69ead8a6aa9d8cf51da0972b69ead8a"
 *         description: "We use this token to check if the user has the email, and if there is an account associated with this token after hashing it."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: "new_password_example"
 *     responses:
 *       200:
 *         description: Password updated successfully (returns generic response even if email doesn't exist for security)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password has been updated successfully"
 *                 data:
 *                   type: object
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
export const resetPass = async (req: Request, res: Response) => {
  const resetToken = req.query.token as string;
  const newPassword = req.body.newPassword as string;
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
    isVerified: getUser.isVerified,
    avatar: getUser.avatar,
    gender: getUser.gender,
    phone: getUser.phone,
  };

  res.status(200).json({
    success: true,
    message: "Password has been updated successfully",
    data: user,
  });
};
