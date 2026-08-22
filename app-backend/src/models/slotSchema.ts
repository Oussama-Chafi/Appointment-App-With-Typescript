import mongoose from "mongoose";
import { Doctor } from "./doctorSchema.js";
import type { ISlotSchemaType } from "../types/app.js";
const slotSchema = new mongoose.Schema<ISlotSchemaType>(
  {
    doctorID: {
      type: mongoose.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true },
);

const DocSlot = mongoose.model("DocSlot", slotSchema);

export default DocSlot;
