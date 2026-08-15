import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  bookAppointment,
  getMyAppointment,
} from "../controllers/appointmentController.js";
const router = express();

router.route("/book/:slotID").post(verifyToken, bookAppointment);
router.route("/my-appointments").get(verifyToken, getMyAppointment);

export default router;
