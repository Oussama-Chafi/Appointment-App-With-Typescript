import express from "express";
import { allowedTo, verifyToken } from "../middlewares/verifyToken.js";
import { addDoctorSlots, applyAsDoctor } from "../controllers/doctorController.js";
const router = express();

router.route("/app-as-doctor").post(verifyToken , applyAsDoctor);
router.route("/add-slots").post(verifyToken,allowedTo("doctor"),addDoctorSlots);

export default router;