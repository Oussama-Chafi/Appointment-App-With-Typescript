import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { rateValidation } from "../validation/rateValidation.js";
import { Types } from "mongoose";
import Appointment from "../models/appointmentSchema.js";
import { Doctor } from "../models/doctorSchema.js";
import Review from "../models/ReviewSchema.js";

export const createReview = async (req: Request, res: Response) => {
  const { error } = rateValidation.validate(req.body);

  if (error) {
    throw new AppError(
      400,
      error.details[0]?.message || "all fields are required",
    );
  }
  const { rate, comment } = req.body;
  const patientID = req.user?.id;
  const doctorID = req.params.doctorID as string;
  const appointmentID = req.params.appointmentID as string;

  if (!patientID) {
    throw new AppError(401, "you are unauthenticated");
  }
  if (
    !Types.ObjectId.isValid(doctorID) ||
    !Types.ObjectId.isValid(appointmentID)
  ) {
    throw new AppError(400, "Invaled doctor ID or appointment ID format");
  }

  const [findAppointment, findDoc, existRating] = await Promise.all([
    Appointment.findById(appointmentID).lean(),
    Doctor.findById(doctorID).lean(),
    Review.findOne({ appointmentID }).lean(),
  ]);

  if (!findAppointment) {
    throw new AppError(404, "No appointment exist with this ID");
  }
  if (!findDoc) {
    throw new AppError(404, "Doctor profile not found");
  }
  if (existRating) {
    throw new AppError(400, "This appointment has already been reviewed");
  }
  if (patientID !== findAppointment.patientID.toString()) {
    throw new AppError(403, "you cannot rate someone's appointment");
  }
  if (findAppointment.doctorID.toString() !== doctorID) {
    throw new AppError(403, "This doctor was not assigned to this appointment");
  }
  if (findAppointment.status !== "completed") {
    throw new AppError(400, "You can only review completed Appointment");
  }

  const createReview = await Review.create({
    patientID,
    doctorID,
    appointmentID,
    rating: rate,
    comment,
  });

  const state = await Review.aggregate([
    { $match: { doctorID: new Types.ObjectId(doctorID) } },
    {
      $group: {
        _id: "$doctorID",
        numOfReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  if (state.length > 0) {
    await Doctor.findByIdAndUpdate(doctorID, {
      numOfReviews: state[0].numOfReviews,
      averageRating: Number(state[0].averageRating.toFixed(1)),
    });
  }
  await createReview.populate([
    { path: "patientID", select: "first_name last_name avatar" },
    {
      path: "doctorID",
      select:
        "phone address specialty consultationFee isAcceptingAppointments averageRating numOfReviews userID",
      populate: {
        path: "userID",
        select: "first_name last_name email avatar gender ",
      },
    },
    {
      path: "appointmentID",
      select: "status price slotID",
      populate: { path: "slotID", select: "date startTime endTime" },
    },
  ]);

  res.status(201).json({
    success: true,
    message: "Review has been created successfully",
    createReview,
  });
};
