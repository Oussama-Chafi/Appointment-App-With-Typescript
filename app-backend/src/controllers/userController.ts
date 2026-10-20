import { response, type Request, type Response } from "express";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";
import bcrypt from "bcrypt";

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get profile
 *     tags: [user]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Profile found"
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
 *                   example: "Your account profile"
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthenticated
 *       404:
 *         description: User profile not found
 *       403:
 *         descreption: accessToken is invalid
 */
export const getProfile = async (req: Request, res: Response) => {
  const userID = req.user?.id as string;
  if (!userID) {
    throw new AppError(401, "You are now unauthenticated.");
  }
  const getProfile = await User.findById({ _id: userID })
    .select("-password -avatarPublicID -tokenVersion -resetToken")
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

/**
 * @swagger
 * /profile/update-profile:
 *   patch:
 *     summary: Update profile of the user
 *     tags: [user]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - phone
 *               - gender
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "update_first_name"
 *               last_name:
 *                 type: string
 *                 example: "update_last_name"
 *               email:
 *                 type: string
 *                 example: "update_email"
 *               phone:
 *                 type: string
 *                 example: "1234567890"
 *               gender:
 *                 type: string
 *                 example: "Male"
 *     responses:
 *       200:
 *         description: "Profile updated successfully"
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
 *                   example: "User profile updated successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: If user doesn't update anything
 *       401:
 *         description: Unauthenticated, token missing
 *       403:
 *         description: Access token is invalid
 *       404:
 *         description: If user profile not found
 */
export const updateProfile = async (req: Request, res: Response) => {
  const userID = req.user?.id as string;
  const { first_name, last_name, email, phone, gender } = req.body;
  if (!userID) {
    throw new AppError(401, "You are now unauthenticated.");
  }
  if (!first_name && !last_name && !email && !phone && !gender) {
    throw new AppError(400, "You should update at least one feld");
  }
  const getProfile = await User.findByIdAndUpdate(
    userID,
    { first_name, last_name, email, phone, gender },
    { returnDocument: "after", runValidators: true },
  )
    .select("-password -avatarPublicID -tokenVersion -resetToken")
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

/**
 * @swagger
 * /profile/change-password:
 *   patch:
 *     summary: Change the password
 *     tags: [user]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmNewPass
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "12345678"
 *               newPassword:
 *                 type: string
 *                 example: "87654321"
 *               confirmNewPass:
 *                 type: string
 *                 example: "87654321"
 *     responses:
 *       200:
 *         description: "Password has been changed successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messsage:
 *                   type: string
 *                   example: "The password has been changed successfully"
 *       400:
 *         description: confirmation was not correct, the old password wasn't correct,
 *       401:
 *         description:  Unauthenticated, token missing
 *       404:
 *         description: If account not found
 *       403:
 *         description: accessToken is invalid
 */
export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword, confirmNewPass } = req.body;
  if (newPassword !== confirmNewPass) {
    throw new AppError(
      400,
      "Confirmation of the new Password is not matching with the new Password",
    );
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

/**
 * @swagger
 * /profile/delete-account:
 *   delete:
 *     summary: Delete the account
 *     tags: [user]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       204:
 *         description: Account has been deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: If password is missing , if passowrd wasn't correct
 *       404:
 *         description: If account not found
 *       401:
 *         description: Unauthenticated, token missing
 *       403:
 *         description: Forbidden, accessToken is invaild
 */
export const deleteAccount = async (req: Request, res: Response) => {
  const password = req.body.password as string;
  if (!password) {
    throw new AppError(400, "Password is required!");
  }
  const userID = req.user?.id as string;
  if (!userID) {
    throw new AppError(401, "You are now unauthenticated");
  }
  const getAccount = await User.findById(userID).lean();
  if (!getAccount) {
    throw new AppError(404, "User account not found");
  }
  const comparePasswords = await bcrypt.compare(password, getAccount.password);
  if (!comparePasswords) {
    throw new AppError(400, "The password is not correct");
  }
  await User.findByIdAndDelete(userID);

  res.status(204).json({ success: true });
};

/**
 * @swagger
 * /profile/logout-all:
 *   patch:
 *     summary: Logout from all devices
 *     tags: [user]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
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
 *                   example: "Logged out from all devices successfully"
 *       400:
 *         description: If password is missing , if passowrd wasn't correct
 *       404:
 *         description: If account not found
 *       401:
 *         description: Unauthenticated, token missing
 *       403:
 *         description: Forbidden, accessToken is invaild
 */
export const logoutAllDevices = async (req: Request, res: Response) => {
  const password = req.body.password as string;
  if (!password) {
    throw new AppError(400, "the password is missing");
  }
  const userID = req.user?.id;
  if (!userID) {
    throw new AppError(401, "You are unauthenticated");
  }
  const getAccount = await User.findById(userID).lean();
  if (!getAccount) {
    throw new AppError(404, "User account not found");
  }
  const comparePasswords = await bcrypt.compare(password, getAccount.password);
  if (!comparePasswords) {
    throw new AppError(400, "The password is not correct");
  }
  await User.findByIdAndUpdate(userID, {
    $inc: { tokenVersion: 1 },
  });
  res.status(200).json({
    success: true,
    message: "Logged out from all devices successfully",
  });
};
