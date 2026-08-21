import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import {
  removeOldImage,
  uploadToCloudinary,
} from "../middlewares/uploadImages.js";
import User from "../models/userSchema.js";

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
