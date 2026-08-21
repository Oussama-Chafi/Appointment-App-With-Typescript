import { type Request, type Response } from "express";
import { Doctor } from "../models/doctorSchema.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";
import Appointment from "../models/appointmentSchema.js";

export const getPendingDoctorRequest = async (req: Request, res: Response) => {
  const pendingRequest = await Doctor.find({ status: "pending" })
    .populate("userID", "first_name last_name email phone gender avatar")
    .exec();
  if (pendingRequest.length === 0) {
    return res.status(200).json({
      success: true,
      message: "There is no Requests in this Time.",
    });
  }
  res.status(200).json({
    success: true,
    message: "This is all requests in DB",
    pendingRequest,
  });
};

export const updateDoctorStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    throw new AppError(400, "Invalid status parameter");
  }
  const findDocReq = await Doctor.findById(id).exec();

  if (!findDocReq) {
    throw new AppError(404, "This Account is not exist enymore !");
  }
  if (status === "approved") {
    findDocReq.status = status;
    await findDocReq.save();
    const updateRole = await User.findByIdAndUpdate(findDocReq.userID, {
      role: "doctor",
    });

    await findDocReq.populate("userID", "first_name last_name email avatar phone gender");

    return res.status(200).json({
      success: true,
      message: `Doctor request has been successfully ${status}`,
      data: findDocReq,
    });
  } else {
    await Doctor.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: " This request has been deleteModel.",
    });
  }
};

export const getAllPatients = async (req: Request, res: Response) => {
  const getPatients = await User.find({ role: "patient" })
    .select("-password")
    .exec();
  res.status(200).json({
    success: true,
    message: "This is all patients in the app",
    patientLength: getPatients.length,
    getPatients,
  });
};

export const getAllDoctors = async (req: Request, res: Response) => {
  const getDoctors = await Doctor.find()
    .populate("userID", "first_name last_name email avatar gender")
    .exec();
  res.status(200).json({
    success: true,
    message: "This is all doctors in the app",
    doctorLength: getDoctors.length,
    getDoctors,
  });
};

export const getAppointments = async (req: Request, res: Response) => {
  const getAppointment = await Appointment.find().populate([
    { path: "patientID", select: "first_name last_name email phone gender" },
    { path: "slotID", select: "date startTime endTime isBooked" },
    {
      path: "doctorID",
      select:
        "address phone specialty consultationFee isAcceptingAppointments status averageRating numOfReviews userID",
      populate: {
        path: "userID",
        select: "first_name last_name email avatar gender",
      },
    },
  ]);
  res.status(200).json({
    success: true,
    message: "This all appointments in the app",
    appointmentsLength: getAppointment.length,
    getAppointment,
  });
};
