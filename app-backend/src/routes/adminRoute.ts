import express from "express";
import { allowedTo, verifyToken } from "../middlewares/verifyToken.js";
import { getPendingDoctorRequest, updateDoctorStatus } from "../controllers/adminController.js";
const router = express();

router.route("/doctor-requests").get(verifyToken,allowedTo("admin"),getPendingDoctorRequest);
router.route("/doctor-requests/:id/status").patch(verifyToken,allowedTo("admin"),updateDoctorStatus);

export default router