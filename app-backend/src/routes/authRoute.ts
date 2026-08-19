import express, { type Request, type Response } from "express";
import {
  login,
  logout,
  refresh,
  register,
} from "../controllers/authController.js";
import { allowedTo, verifyToken } from "../middlewares/verifyToken.js";
import { verifyEmail } from "../controllers/verifyEmailController.js";
const router = express();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh").get(refresh);
router.route("/logout").post(logout);
router.route("/verify-email").get(verifyEmail);

export default router;
