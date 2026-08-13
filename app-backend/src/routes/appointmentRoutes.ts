import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { bookAppointment } from "../controllers/appointmentController.js";
const router = express();

router.route("/book/:slotID").post(verifyToken, bookAppointment);

export default router;
