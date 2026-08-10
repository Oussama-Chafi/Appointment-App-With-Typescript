import express, { type Request, type Response } from "express";
import {
  login,
  logout,
  refresh,
  register,
} from "../controllers/authController.js";
import { allowedTo, verifyToken } from "../middlewares/verifyToken.js";
const router = express();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh").get(refresh);
router.route("/logout").post(logout);

export default router;
