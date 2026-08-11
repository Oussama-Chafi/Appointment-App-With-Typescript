import type { Request, Response } from "express";
import { applyAsDoctorVali } from "../validation/doctorValidation.js";
import { AppError } from "../utils/AppError.js";
import { Doctor } from "../models/doctorSchmea.js";

export const applyAsDoctor = async (req: Request, res: Response) => {
  const { error, value } = applyAsDoctorVali.validate(req.body);
  if (error) {
    throw new AppError(
      400,
      error.details[0]?.message || "You should add all Informations !",
    );
  }
  const {
    address,
    availableDayes,
    consultationFree,
    specialty,
    endTime,
    startTime,
    phone,
  } = value;
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
    availableDayes,
    consultationFree,
    specialty,
    endTime,
    startTime,
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
