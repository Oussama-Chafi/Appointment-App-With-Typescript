import mongoose from "mongoose";
import User from "./userSchema.js";
import { Doctor } from "./doctorSchema.js";
import DocSlot from "./slotSchema.js";
import type { IAppointmentSchema } from "../types/app.js";

const appointmentSchema = new mongoose.Schema<IAppointmentSchema>(
  {
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
      enum: ["pending", "confirmed", "cancelled", "completed", "rejected"],
      default: "pending",
    },
    price: {
      type: Number,
      default: 50,
    },
    payment: {
      type: Boolean,
      default: false,
    },
    paymentIntentId: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    notes: {
      type: String,
      default: "Get well soon.",
    },
  },
  { timestamps: true },
);

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
