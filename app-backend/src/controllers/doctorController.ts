import type { Request, Response } from "express";
import {
  addDoctorSlotsVali,
  applyAsDoctorVali,
} from "../validation/doctorValidation.js";
import { AppError } from "../utils/AppError.js";
import { Doctor } from "../models/doctorSchema.js";
import DocSlot from "../models/slotSchema.js";

export const applyAsDoctor = async (req: Request, res: Response) => {
  const { error, value } = applyAsDoctorVali.validate(req.body);
  if (error) {
    throw new AppError(
      400,
      error.details[0]?.message || "You should add all Informations !",
    );
  }
  const { address, consultationFee, specialty, phone } = value;
  const userID = req.user?.id;
  if (!userID) {
    throw new AppError(401, "User is not authenticated");
  }
  const existingRequest = await Doctor.findOne({ userID }).exec();
  if (existingRequest) {
    throw new AppError(400, " you have already send a Request");
  }

  const newDoctorRequest = await Doctor.create({
    userID,
    address,
    consultationFee,
    specialty,
    phone,
    // status : "pending"
  });
  res.status(201).json({
    success: true,
    message:
      "your application has been successfully submitted, and is under review.",
    newDoctorRequest,
  });
};

export const addDoctorSlots = async (req: Request, res: Response) => {
  const { error } = addDoctorSlotsVali.validate(req.body);
  if (error) {
    throw new AppError(
      400,
      error.details[0]?.message || "All fields are required!",
    );
  }
  const { date, startTime, endTime, excludedSlots } = req.body;
  const doctorID = req.user?.id;
  if (!doctorID) {
    throw new AppError(400, "This User is Unthenticated.");
  }
  const findDoc = await Doctor.findOne({ userID: doctorID });
  if (!findDoc) {
    throw new AppError(400, "Doctor Profile not found.");
  }
  const currentDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(currentDate.getTime()) || currentDate < today) {
    throw new AppError(400, "Cannot create slots to past dates!");
  }
  const slotsToInsert = [];
  let startHour = parseInt(startTime.split(":")[0]);
  let endHour = parseInt(endTime.split(":")[0]);
  const safeExcludedSlotsArray = Array.isArray(excludedSlots)
    ? excludedSlots
    : [];

  while (startHour < endHour) {
    const slotStart = `${startHour.toString().padStart(2, "0")}:00`;
    const slotEnd = `${(startHour + 1).toString().padStart(2, "0")}:00`;
    if (!safeExcludedSlotsArray.includes(slotStart)) {
      slotsToInsert.push({
        doctorID,
        date,
        startTime: slotStart,
        endTime: slotEnd,
      });
    }
    startHour++;
  }
  const createSlots = await DocSlot.insertMany(slotsToInsert);
  res.status(201).json({
    success: true,
    message: "Slots created Successfully.",
    slotsLength: createSlots.length,
    createSlots,
  });
};
