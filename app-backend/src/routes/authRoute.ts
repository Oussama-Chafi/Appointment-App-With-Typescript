import express from "express";
import { login, logout, refresh, register } from "../controllers/authController.js";
const router = express();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh").get(refresh);
router.route("/logout").post(logout);

export default router;
