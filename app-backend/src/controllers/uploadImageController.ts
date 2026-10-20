import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import {
  removeOldImage,
  uploadToCloudinary,
} from "../middlewares/uploadImages.js";
import User from "../models/userSchema.js";

/**
 * @swagger
 * /images/upload-avatar:
 *   patch:
 *     summary: Upload or update user avatar image
 *     tags: [user]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
 *     responses:
 *       200:
 *         description: Avatar has been uploaded successfully
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
 *                   example: "Avatar has been uploaded successfully"
 *                 imageUrl:
 *                   type: string
 *                   example: "https://res.cloudinary.com/.../image.jpg"
 *                 publicId:
 *                   type: string
 *                   example: "AppoiProj/profileAvatar/xyz123"
 *       400:
 *         description: Add the avatar first (file missing)
 *       401:
 *         description: You are unauthenticated
 *       404:
 *         description: This account profile not found
 */
export const uploadAvatar = async (req: Request, res: Response) => {
  const image = req.file;
  if (!image) {
    throw new AppError(400, "Add the avatar first.");
  }
  const userID = req.user?.id;
  if (!userID) {
    throw new AppError(401, "You are unauthenticated");
  }
  const findUser = await User.findOne({ _id: userID });
  if (!findUser) {
    throw new AppError(404, "This account porfile not found.");
  }
  if (findUser.avatarPublicID) {
    await removeOldImage(findUser.avatarPublicID);
  }

  const result = await uploadToCloudinary(image, "AppoiProj/profileAvatar");
  const imageUrl = result.secure_url;
  const publicId = result.public_id;
  await User.findByIdAndUpdate(userID, {
    avatar: imageUrl,
    avatarPublicID: publicId,
  });
  res.status(200).json({
    success: true,
    message: "Avatar has been uploaded successfully",
    imageUrl,
    publicId,
  });
};
