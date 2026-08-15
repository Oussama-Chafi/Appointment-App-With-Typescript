import express from "express";
import { allowedTo, verifyToken } from "../middlewares/verifyToken.js";
import { addDoctorSlots, applyAsDoctor, getAvailableSlots, getDoctorAppointments } from "../controllers/doctorController.js";
const router = express();

router.route("/app-as-doctor").post(verifyToken , applyAsDoctor);
router.route("/add-slots").post(verifyToken,allowedTo("doctor"),addDoctorSlots);
router.route("/available-slots").get(verifyToken,allowedTo("doctor"),getAvailableSlots)
router.route("/my-appointments").get(verifyToken,allowedTo("doctor"),getDoctorAppointments)

export default router;