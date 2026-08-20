import express, { type Request, type Response } from "express";
import {
  login,
  logout,
  refresh,
  register,
} from "../controllers/authController.js";
import { allowedTo, verifyToken } from "../middlewares/verifyToken.js";
import { verifyEmail } from "../controllers/verifyEmailController.js";
import { forgetPass } from "../controllers/forgetPassController.js";
import { resetPass } from "../controllers/resetPassController.js";
const router = express();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh").get(refresh);
router.route("/logout").post(logout);
router.route("/verify-email").get(verifyEmail);
router.route("/forget-password").post(forgetPass);
router.route("/reset-password").patch(resetPass);

export default router;
