import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  bookAppointment,
  cancelAppointment,
  getMyAppointment,
} from "../controllers/appointmentController.js";
const router = express();

router.route("/book/:slotID").post(verifyToken, bookAppointment);
router.route("/my-appointments").get(verifyToken, getMyAppointment);
router
  .route("/cancel-appointment/:appointmentID")
  .post(verifyToken, cancelAppointment);

export default router;
