import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { applyAsDoctor } from "../controllers/doctorController.js";
const router = express();

router.route("/app-as-doctor").post(verifyToken , applyAsDoctor);

export default router;