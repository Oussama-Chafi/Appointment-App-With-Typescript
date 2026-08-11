import mongoose from "mongoose";
import type { IDoctroSchema } from "../types/app.js";
import User from "./userSchema.js";

const doctorSchema = new mongoose.Schema<IDoctroSchema>({
  userID: {
    type : mongoose.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  phone: {
    type : String,
    required : true,
  },
  specialty: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  consultationFree: {
    type: Number,
    required: true,
  },
  availableDayes: {
    type: [String],
    required: true,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
  },
  startTime: {
    type: String,
    required: true,
    default: "09:00",
  },
  endTime: {
    type: String,
    required: true,
    default: "17:00",
  },
  isAcceptingAppointments: {
    type: Boolean,
    required: true,
    default : true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
},{timestamps : true});

export const Doctor = mongoose.model<IDoctroSchema>("Doctor", doctorSchema);
