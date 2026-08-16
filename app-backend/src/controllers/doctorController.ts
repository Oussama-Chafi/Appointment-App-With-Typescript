import type { Request, Response } from "express";
import {
  addDoctorSlotsVali,
  applyAsDoctorVali,
} from "../validation/doctorValidation.js";
import { AppError } from "../utils/AppError.js";
import { Doctor } from "../models/doctorSchema.js";
import DocSlot from "../models/slotSchema.js";
import Appointment from "../models/appointmentSchema.js";

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

  console.log(typeof userID);
  const newDoctorRequest = await Doctor.create({
    userID,
    address,
    consultationFee,
    specialty,
    phone,
    // status : "pending"
  });

  await newDoctorRequest.populate("userID", "first_name last_name email");

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
        doctorID: findDoc._id,
        date,
        startTime: slotStart,
        endTime: slotEnd,
      });
    }
    startHour++;
  }
  const createSlots = await DocSlot.insertMany(slotsToInsert);
  await DocSlot.populate(createSlots, {
    path: "doctorID",
    select: "phone specialty address consultationFee userID",
    populate: {
      path: "userID",
      select: "first_name last_name email",
    },
  });

  res.status(201).json({
    success: true,
    message: "Slots created Successfully.",
    slotsLength: createSlots.length,
    createSlots,
  });
};

export const getAvailableSlots = async (req: Request, res: Response) => {
  const today = new Date().toISOString().split("T")[0];
  const availableSlots = await DocSlot.find({
    date: { $gte: today as string },
    isBooked: false,
  });
  if (availableSlots.length === 0) {
    throw new AppError(404, "No Slots found .");
  }
  res.status(200).json({
    success: true,
    message: "All slots available retrieved successfully.",
    data: availableSlots,
  });
};

export const getDoctorAppointments = async (req: Request, res: Response) => {
  const userID = req.user?.id;
  if (!userID) {
    throw new AppError(401, "You should Log in first.");
  }
  const findDoc = await Doctor.findOne({ userID }).exec();
  if (!findDoc) {
    throw new AppError(404, "Doctor Profile not found!");
  }
  const docAppointment = await Appointment.find({
    doctorID: findDoc._id,
  })
    .populate([
      { path: "patientID", select: "first_name last_name email" },
      { path: "slotID", select: "date startTime endTime" },
    ])
    .exec();
  if (docAppointment.length === 0) {
    throw new AppError(404, "You have no Appointment booked yet.");
  }

  res.status(200).json({
    success: true,
    message: "This is all your Appointments",
    appointmentsLength: docAppointment.length,
    data: docAppointment,
  });
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  const appointmentID = req.params.appointmentID as string;
  const { status } = req.body;
  if (!["confirmed", "rejected", "completed"].includes(status)) {
    throw new AppError(400, "Add your status for this Appointment!");
  }
  const userID = req.user?.id;
  if (!userID) {
    throw new AppError(401, "You should Log in first!");
  }
  const findDoc = await Doctor.findOne({ userID }).exec();

  if (!findDoc) {
    throw new AppError(404, "Doctor Profile not found!");
  }
  const getAppointment = await Appointment.findById(appointmentID).exec();
  if (!getAppointment) {
    throw new AppError(404, "This Appointment not found!");
  }
  if (findDoc._id.toString() !== getAppointment.doctorID.toString()) {
    throw new AppError(
      403,
      "You cannot handle the Status of this Appointment.",
    );
  }

  if (getAppointment.status === "rejected") {
    throw new AppError(
      400,
      "You cannot update an Appointment that has already been rejected!",
    );
  }
  if (status === "rejected") {
    await DocSlot.findByIdAndUpdate(getAppointment.slotID, {
      isBooked: false,
    });
  }

  getAppointment.status = status;
  await getAppointment.save();

  res.status(200).json({
    success: true,
    message: "The Status has been changed successfully.",
    data: getAppointment,
  });
};
