import express from "express";
import { allowedTo, verifyToken } from "../middlewares/verifyToken.js";
import {
  cancelAppointmentByAdmin,
  deleteAnAccount,
  deleteManySlotsByAdmin,
  deleteOneSlotByAdmin,
  getAllDoctors,
  getAllPatients,
  getAppointments,
  getPendingDoctorRequest,
  toggleBlockUser,
  updateDoctorStatus,
  updateRoleOfUser,
} from "../controllers/adminController.js";
import { validateBody } from "../middlewares/validationData.js";
import { deleteManyDocSlotsVali } from "../validation/doctorValidation.js";
const router = express.Router();

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
  .route("/cancel-appointment/:appointmentId")
  .patch(verifyToken, allowedTo("admin"), cancelAppointmentByAdmin);
router
  .route("/update-role/:userId")
  .patch(verifyToken, allowedTo("admin"), updateRoleOfUser);
router
  .route("/block-user/:userId")
  .patch(verifyToken, allowedTo("admin"), toggleBlockUser);
router
  .route("/delete-account/:userId")
  .delete(verifyToken, allowedTo("admin"), deleteAnAccount);

router
  .route("/delete-slot/:slotID")
  .delete(verifyToken, allowedTo("admin"), deleteOneSlotByAdmin);

router
  .route("/delete-many-slots")
  .delete(
    validateBody(deleteManyDocSlotsVali),
    verifyToken,
    allowedTo("admin"),
    deleteManySlotsByAdmin,
  );

export default router;
