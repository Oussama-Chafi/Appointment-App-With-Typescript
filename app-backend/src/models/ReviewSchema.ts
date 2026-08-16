import mongoose from "mongoose";
import type { IReviewSchema } from "../types/app.js";
import User from "./userSchema.js";
import { Doctor } from "./doctorSchema.js";
import Appointment from "./appointmentSchema.js";
const reviewSchema = new mongoose.Schema<IReviewSchema>(
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
    appointmentID: {
      type: mongoose.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    rating: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5],
      default: 0,
    },
    comment: {
      type: String,
    },
  },
  { timestamps: true },
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;
