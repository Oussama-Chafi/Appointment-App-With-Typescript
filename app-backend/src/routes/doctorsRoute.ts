import express from "express";
import { allowedTo, verifyToken } from "../middlewares/verifyToken.js";
import {
  addDoctorSlots,
  applyAsDoctor,
  deleteDoctorSlot,
  deleteManyDoctorSlots,
  getAvailableSlots,
  getDoctorAppointments,
  getDoctorProfile,
  updateAppointmentStatus,
  updateDoctorProfile,
} from "../controllers/doctorController.js";
import { validateBody } from "../middlewares/validationData.js";
import {
  deleteManyDocSlotsVali,
  updateDoctorProfileVali,
} from "../validation/doctorValidation.js";
const router = express();

router.route("/app-as-doctor").post(verifyToken, applyAsDoctor);
router
  .route("/add-slots")
  .post(verifyToken, allowedTo("doctor"), addDoctorSlots);
router
  .route("/available-slots")
  .get(verifyToken, allowedTo("doctor"), getAvailableSlots);
router
  .route("/appointments/my-appointments")
  .get(verifyToken, allowedTo("doctor"), getDoctorAppointments);
router
  .route("/appointments/:appointmentID/status")
  .post(verifyToken, allowedTo("doctor"), updateAppointmentStatus);

router.route("/get-profile/:doctorID").get(getDoctorProfile);
router
  .route("/update-profile/:doctorID")
  .patch(
    validateBody(updateDoctorProfileVali),
    verifyToken,
    allowedTo("doctor"),
    updateDoctorProfile,
  );
router
  .route("/delete-slot")
  .delete(verifyToken, allowedTo("doctor"), deleteDoctorSlot);
router
  .route("/delete-many-slots")
  .delete(
    validateBody(deleteManyDocSlotsVali),
    verifyToken,
    allowedTo("doctor"),
    deleteManyDoctorSlots,
  );
export default router;
