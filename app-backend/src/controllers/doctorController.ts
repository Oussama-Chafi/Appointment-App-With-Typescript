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
  const { error, value } = addDoctorSlotsVali.validate(req.body);
  if (error) {
    throw new AppError(
      400,
      error.details[0]?.message || "All fields are required!",
    );
  }
  const { date, startTime, endTime } = value;
  const doctorID = req.user?.id;
  console.log(date);
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log(inputDate);
  console.log(inputDate.getTime());
  if (isNaN(inputDate.getTime()) || inputDate < today) {
    throw new AppError(400, "Cannot create slots for past dates !");
  }
  if (!doctorID) {
    throw new AppError(401, "This Doctor is not Authenticated !");
  }
  const findDoc = await Doctor.findOne({ userID: doctorID }).exec();
  if (!findDoc) {
    throw new AppError(401, "Doctor Profile not found !");
  }
  const createSlot = await DocSlot.create({
    doctorID,
    date,
    startTime,
    endTime,
  });
  const doctorResult = await createSlot.populate(
    "doctorID",
    "phone specialty consultationFee isAcceptingAppointments",
  );

  res.status(201).json({
    success: true,
    message: "Your Slots are created Successfully.",
    doctorResult,
  });
};
