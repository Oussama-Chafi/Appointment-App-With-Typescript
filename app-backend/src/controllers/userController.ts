import { response, type Request, type Response } from "express";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";
import bcrypt from "bcrypt";

export const getProfile = async (req: Request, res: Response) => {
  const userID = req.user?.id as string;
  if (!userID) {
    throw new AppError(401, "You are now unauthenticated.");
  }
  const getProfile = await User.findById({ _id: userID })
    .select("-password -avatarPublicID")
    .lean();
  if (!getProfile) {
    throw new AppError(404, "Account profile not found");
  }
  res.status(200).json({
    success: true,
    message: "Your account profile",
    data: getProfile,
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  const userID = req.user?.id as string;
  const { first_name, last_name, email, phone, gender } = req.body;
  if (!userID) {
    throw new AppError(401, "You are now unauthenticated.");
  }

  const getProfile = await User.findByIdAndUpdate(
    userID,
    { first_name, last_name, email, phone, gender },
    { new: true, runValidators: true },
  )
    .select("-password")
    .exec();
  if (!getProfile) {
    throw new AppError(404, "Account profile not found!");
  }
  res.status(200).json({
    success: true,
    message: "Profile has been updated successfully",
    data: getProfile,
  });
};

export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword, confirmNewPass } = req.body;
  if (newPassword !== confirmNewPass) {
    throw new AppError(400, "New Password is not correct");
  }
  const userID = req.user?.id as string;
  if (!userID) {
    throw new AppError(401, "You are now unauthenticated.");
  }
  const getUser = await User.findOne({ _id: userID }).exec();
  if (!getUser) {
    throw new AppError(404, "Account Profile not found");
  }
  const checkOldPassword = await bcrypt.compare(oldPassword, getUser.password);
  if (!checkOldPassword) {
    throw new AppError(400, "The old password is not correct.");
  }
  const hashNewPassword = await bcrypt.hash(newPassword, 10);

  getUser.password = hashNewPassword;

  await getUser.save();
  res.status(200).json({
    success: true,
    message: "The password has been changed successfully",
  });
};

export const deleteAccount = async (req: Request, res: Response) => {
  const userID = req.user?.id as string;
  if (!userID) {
    throw new AppError(401, "You are now unauthenticated");
  }
  const deleteAccount = await User.findByIdAndDelete(userID);
  if (!deleteAccount) {
    throw new AppError(404, "Account profile not found.");
  }
  res.status(204).json({ success: true });
};

export const logoutAllDevices = async (req: Request, res: Response) => {
  const userID = req.user?.id;
  if (!userID) {
    throw new AppError(401, "You are unauthenticated");
  }
  await User.findByIdAndUpdate(userID, {
    $inc: { tokenVersion: 1 },
  });
  res.status(200).json({
    success: true,
    message: "Logged out from all devices successfully",
  });
};
