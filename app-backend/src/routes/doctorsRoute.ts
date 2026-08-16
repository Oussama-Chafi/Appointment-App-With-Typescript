import express from "express";
import { allowedTo, verifyToken } from "../middlewares/verifyToken.js";
import { addDoctorSlots, applyAsDoctor, getAvailableSlots, getDoctorAppointments, updateAppointmentStatus } from "../controllers/doctorController.js";
const router = express();

router.route("/app-as-doctor").post(verifyToken , applyAsDoctor);
router.route("/add-slots").post(verifyToken,allowedTo("doctor"),addDoctorSlots);
router.route("/available-slots").get(verifyToken,allowedTo("doctor"),getAvailableSlots);
router.route("/appointments/my-appointments").get(verifyToken,allowedTo("doctor"),getDoctorAppointments);
router.route("/appointments/:appointmentID/status").post(verifyToken,allowedTo("doctor"),updateAppointmentStatus);

export default router;