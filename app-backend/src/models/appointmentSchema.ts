import mongoose from "mongoose";
import User from "./userSchema.js";
import { Doctor } from "./doctorSchema.js";
import DocSlot from "./slotSchema.js";

const appointmentSchema = new mongoose.Schema({
  patientID: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctorID: {
    type: mongoose.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  slotID: {
    type: mongoose.Types.ObjectId,
    ref: "DocSlot",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
  payment: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    default: "Get well soon.",
  },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
