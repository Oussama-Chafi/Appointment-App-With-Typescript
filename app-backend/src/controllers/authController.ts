import {
  response,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  loginValidation,
  registerValidation,
} from "../validation/authValidation.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";
import bcrypt from "bcrypt";
import jwt, { type JwtPayload, type VerifyErrors } from "jsonwebtoken";
import type { CustomPayload } from "../types/app.js";
import crypto from "crypto";
import sendEmail from "../utils/SendEmail.js";
export const register = async (req: Request, res: Response) => {
  const { error, value } = registerValidation.validate(req.body);
  if (error) {
    throw new AppError(
      400,
      error.details[0]?.message || "you should add all information",
    );
  }
  const { first_name, last_name, email, password, role , phone , gender } = value;

  const isEmailExist = await User.findOne({ email });
  if (isEmailExist) {
    throw new AppError(
      409,
      "This Account is Exist already! please try with another Email",
    );
  }
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const hashPassword = await bcrypt.hash(password, 10);

  const verificationUrl = `http://localhost:3000/auth/verify-email?token=${verificationToken}`;

  await sendEmail(
    email,
    "Email verification",
    ` <h1>confirm your Email</h1>
      <a href = "${verificationUrl}" >click here</a>
    `,
  );

  const addUser = await User.create({
    first_name,
    last_name,
    email,
    password: hashPassword,
    role,
    verificationToken,
    verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    phone ,
    gender,
  });

  res.status(201).json({
    success: true,
    message: "The Account has been created successfully.",
    user: {
      id: addUser._id,
      first_name: addUser.first_name,
      last_name: addUser.last_name,
      email: addUser.email,
      phone : addUser.phone,
      gender : addUser.gender,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const { error, value } = loginValidation.validate(req.body);
  if (error) {
    throw new AppError(
      401,
      error.details[0]?.message || "you should add all information ",
    );
  }
  const { email, password } = value;
  const findUser = await User.findOne({ email });
  if (!findUser) {
    throw new AppError(400, "Email or Password is not correct!");
  }
  const checkPassword = await bcrypt.compare(password, findUser.password);
  if (!checkPassword) {
    throw new AppError(400, "Email or Password is not correct!");
  }
  const accessToken = jwt.sign(
    {
      userInfo: {
        id: findUser._id,
        role: findUser.role,
      },
    },
    process.env.ACCESS_TOKEN as string,
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign(
    {
      userInfo: {
        id: findUser._id,
        role: findUser.role,
      },
    },
    process.env.REFRESH_TOKEN!,
    { expiresIn: "7d" },
  );
  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({
    success: true,
    message: "welcome back",
    user: {
      first_name: findUser.first_name,
      last_name: findUser.last_name,
      email: findUser.email,
      avatar: findUser.avatar,
      isVerified: findUser.isVerified,
      verificationTokenExpiry: findUser.verificationTokenExpiry,
      phone : findUser.phone,
      gender : findUser.gender,
    },
    accessToken,
  });
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    throw new AppError(401, "Unthorized");
  }
  const token = cookies.jwt;
  jwt.verify(
    token,
    process.env.REFRESH_TOKEN as string,
    async (
      err: VerifyErrors | null,
      decoded: JwtPayload | string | undefined,
    ) => {
      try {
        if (err) {
          throw new AppError(403, "forbidden!");
        }
        const payload = decoded as CustomPayload;
        const findUser = await User.findById(payload.userInfo.id).exec();
        if (!findUser) {
          throw new AppError(401, "This Account is not Exist enymore");
        }
        const accessToken = jwt.sign(
          {
            userInfo: {
              id: findUser._id,
              role: findUser.role,
            },
          },
          process.env.ACCESS_TOKEN as string,
          { expiresIn: "15m" },
        );
        res.status(200).json({
          message: "refresh token",
          user: {
            first_name: findUser.first_name,
            last_name: findUser.last_name,
            email: findUser.email,
            avatar: findUser.avatar,
            isVerified: findUser.isVerified,
            verificationTokenExpiry: findUser.verificationTokenExpiry,
            phone : findUser.phone,
            gender : findUser.gender,
          },
          accessToken,
        });
      } catch (error) {
        console.error(error);
        next(error);
      }
    },
  );
};

export const logout = (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    return res.sendStatus(204);
  }
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.status(200).json({ message: "see you soon!" });
};
