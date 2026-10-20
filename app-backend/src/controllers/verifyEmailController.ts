import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify token and verify account
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           example: "6aa9d8cf51da0972b69ead8a6aa9d8cf51da0972b69ead8a"
 *         description: "We use this token to check if the user has the email, and if there is an account associated with this token in database."
 *     responses:
 *       200:
 *         description: Account verified successfully (change isVerified to true )
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
 *                   example: "Your account is verified successfully. You can log in now"
 *                 data:
 *                   type: object
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
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
  const verifyUser = await User.findOne({ _id: getUser._id });
  res.status(200).json({
    success: true,
    message: "Your account is verified successfully. You can log in now",
    data: verifyUser,
  });
};
