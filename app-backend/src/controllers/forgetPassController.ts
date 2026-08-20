import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";
import crypto from "crypto";
import sendEmail from "../utils/SendEmail.js";

export const forgetPass = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError(400, "Email address is required.");
  }
  const getUser = await User.findOne({ email }).exec();
  if (!getUser) {
    throw new AppError(
      404,
      "If an account with that email exist, we sent a password reset link.",
    );
  }
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;

  getUser.resetToken = hashResetToken;
  getUser.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await getUser.save();
  await sendEmail(
    email,
    "RESET YOUR PASSWORD",
    `
        <div style="font-family: Arial , sans-serif ; padding : 20px ; border : 1px solid #eee;">
            <h2 style = "text-align : center ; margin-bottom :5px; ">Reset Token</h2>
            <p >You can click this button and then you can change your password</p>
            <a href=${resetUrl} style="margin-top : 3px ; padding :12px 20px ; background-color : #5044E5 ;
               color : white ; text-decoration : none ; cursor: pointer ; border-radius : 4px ; border : none;"
            >
            Click here
            </a> 
        </div>
    `,
  );
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
    message:
      "you can check your email and you can click the button to change the password",
    data: user,
  });
};
