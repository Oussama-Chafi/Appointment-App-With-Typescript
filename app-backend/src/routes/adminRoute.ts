import express from "express";
import { allowedTo, verifyToken } from "../middlewares/verifyToken.js";
import {
  getAllDoctors,
  getAllPatients,
  getAppointments,
  getPendingDoctorRequest,
  updateDoctorStatus,
  updateRoleOfUser,
} from "../controllers/adminController.js";
const router = express();

router
  .route("/doctor-requests")
  .get(verifyToken, allowedTo("admin"), getPendingDoctorRequest);
router
  .route("/doctor-requests/:id/status")
  .patch(verifyToken, allowedTo("admin"), updateDoctorStatus);

router
  .route("/all-patients")
  .get(verifyToken, allowedTo("admin"), getAllPatients);
router
  .route("/all-doctors")
  .get(verifyToken, allowedTo("admin"), getAllDoctors);
router
  .route("/all-appointments")
  .get(verifyToken, allowedTo("admin"), getAppointments);
router
  .route("/update-role/:userId")
  .patch(verifyToken, allowedTo("admin"), updateRoleOfUser);

export default router;
