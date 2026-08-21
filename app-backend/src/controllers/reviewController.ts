import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { rateValidation } from "../validation/rateValidation.js";
import Appointment from "../models/appointmentSchema.js";
import { Doctor } from "../models/doctorSchema.js";
import Review from "../models/ReviewSchema.js";

export const createReview = async (req: Request, res: Response) => {
  const { error } = rateValidation.validate(req.body);

  if (error) {
    throw new AppError(
      400,
      error.details[0]?.message || "All fields are required!",
    );
  }
  const { rate, comment } = req.body;
  const patientID = req.user?.id;
  const doctorID = req.params.doctorID as string;
  const appointmentID = req.params.appointmentID as string;

  if (!patientID) {
    throw new AppError(401, "You should Log in first!");
  }
  if (!doctorID) {
    throw new AppError(400, "You should add the Doctor ID !");
  }
  if (!appointmentID) {
    throw new AppError(400, "You should add the Appointment ID!");
  }
  const findAppointment = await Appointment.findById(appointmentID).exec();
  if (!findAppointment) {
    throw new AppError(404, "This Appointment not found.");
  }
  const findDoc = await Doctor.findById(doctorID).exec();
  if (!findDoc) {
    throw new AppError(404, "Doctor Profile not found!");
  }
  if (patientID !== findAppointment.patientID.toString()) {
    throw new AppError(
      403,
      "You cannout add comment for this Appointment because is not for you!",
    );
  }
  if (findDoc._id.toString() !== findAppointment.doctorID.toString()) {
    throw new AppError(
      403,
      "You cannot add Comment to this Doctor because he's not the Doctor who was in this Appoinmtnet!",
    );
  }

  if (findAppointment.status !== "completed") {
    throw new AppError(400, "You can only review completed appointments.");
  }
  const createReview = await Review.create({
    patientID,
    doctorID,
    appointmentID,
    rating: rate,
    comment,
  });

  const allReviews = await Review.find({ doctorID });
  const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
  const averageRating = totalRating / allReviews.length;
  await Doctor.findByIdAndUpdate(doctorID, {
    averageRating: Number(averageRating.toFixed(1)),
    numOfReviews: allReviews.length,
  });

  await createReview.populate([
    { path: "patientID", select: "first_name last_name email avatar gender" },
    {
      path: "appointmentID",
      select: "slotID",
      populate: {
        path: "slotID",
        select: "date startTime endTime",
      },
    },
    {
      path: "doctorID",
      select:
        "specialty phone address consultationFee averageRating numOfReviews userID",
      populate: {
        path: "userID",
        select: "first_name last_name email avatar gender",
      },
    },
  ]);
  res.status(201).json({
    success: true,
    message: "The Comment has been created successfully",
    createReview,
  });
};
