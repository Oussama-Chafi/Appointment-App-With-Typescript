import mongoose from "mongoose";
import type { IDoctroSchema } from "../types/app.js";
import User from "./userSchema.js";

const doctorSchema = new mongoose.Schema<IDoctroSchema>(
  {
    userID: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    specialty: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    consultationFee: {
      type: Number,
      required: true,
    },
    isAcceptingAppointments: {
      type: Boolean,
      required: true,
      default: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const Doctor = mongoose.model<IDoctroSchema>("Doctor", doctorSchema);
