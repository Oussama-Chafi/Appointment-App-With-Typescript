import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import DocSlot from "../models/slotSchema.js";
import Appointment from "../models/appointmentSchema.js";

export const bookAppointment = async (req: Request, res: Response) => {
  const slotID = req.params.slotID as string;
  const patientID = req.user?.id;
  if (!slotID) {
    throw new AppError(400, "Thre is no ID for this Slot!");
  }
  if (!patientID) {
    throw new AppError(
      400,
      "This Account does not exist or is Unauthenticated!",
    );
  }
  const getSlot = await DocSlot.findById(slotID);
  if (!getSlot) {
    throw new AppError(404, "Sorry! this no slot with this ID");
  }
  if (getSlot.isBooked) {
    throw new AppError(
      400,
      "This Appointment is not Available. Please choose another Slot.",
    );
  }

  const createAppointment = await Appointment.create({
    patientID,
    doctorID: getSlot.doctorID,
    slotID,
  });

  getSlot.isBooked = true;
  await getSlot.save();

  await createAppointment.populate([
    { path: "patientID", select: "first_name last_name email" },
    { path: "slotID", select: "date startTime endTime" },
    {
      path: "doctorID",
      select: "phone specialty consultationFee address userID",
      populate: {
        path: "userID",
        select: "first_name last_name email",
      },
    },
  ]);

  res.status(201).json({
    success: true,
    message: "Appointment created successsfully",
    data: createAppointment,
  });
};

export const getMyAppointment = async (req: Request, res: Response) => {
  const patientID = req.user?.id as string;
  if (!patientID) {
    throw new AppError(401, "You should log in first!");
  }
  const myAppointment = await Appointment.find({ patientID })
    .populate([
      { path: "patientID", select: "first_name last_name email" },
      { path: "slotID", select: "date startTime endTime" },
      {
        path: "doctorID",
        select: "specialty address phone consultationFee userID",
        populate: {
          path: "userID",
          select: "first_name last_name email",
        },
      },
    ])
    .exec();
  if (myAppointment.length === 0) {
    throw new AppError(404, "You don't have any Appointments in this Time.");
  }

  res.status(200).json({
    success: true,
    message: "This is all your Appointments",
    AppointmentsLength: myAppointment.length,
    data: myAppointment,
  });
};
