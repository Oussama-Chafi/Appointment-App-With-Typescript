import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import DocSlot from "../models/slotSchema.js";
import Appointment from "../models/appointmentSchema.js";
import User from "../models/userSchema.js";
import { Doctor } from "../models/doctorSchema.js";
import { getStripeInstance } from "../config/stripe.js";
import { generateStripeSession } from "../utils/stripeService.js";
import mongoose from "mongoose";

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
  const getSlot = await DocSlot.findOneAndUpdate(
    { _id: slotID, isBooked: false },
    {
      isBooked: true,
    },
    { returnDocument: "after", runValidators: true },
  );
  if (!getSlot) {
    throw new AppError(
      404,
      "This slot does not exist or has already been booked",
    );
  }
  let createAppointment;
  try {
    createAppointment = await Appointment.create({
      patientID,
      doctorID: getSlot.doctorID,
      slotID,
      price: getSlot.price,
    });
    await createAppointment.populate([
      {
        path: "patientID",
        select: "first_name last_name email avatar phone gender",
      },
      { path: "slotID", select: "date startTime endTime" },
      {
        path: "doctorID",
        select: "phone specialty consultationFee address userID",
        populate: {
          path: "userID",
          select: "first_name last_name email avatar phone gender",
        },
      },
    ]);
    const doctor = createAppointment.doctorID as any;
    const doctorName = `${doctor.userID.first_name} ${doctor.userID.last_name}`;
    const appointmentPrice = createAppointment.price;
    const appointmentID = createAppointment._id.toString();
    const session = await generateStripeSession(
      doctorName,
      appointmentID,
      appointmentPrice,
    );
    res.status(201).json({
      success: true,
      message: "Appointment created successsfully",
      data: {
        appointment: createAppointment,
        paymentUrl: session.url,
      },
    });
  } catch (error: any) {
    await DocSlot.findByIdAndUpdate(slotID, { isBooked: false }, { new: true });
    await Appointment.findByIdAndDelete(createAppointment?._id);
    throw new AppError(400, `Booking fialed:${error.message}`);
  }
};

export const getMyAppointment = async (req: Request, res: Response) => {
  const patientID = req.user?.id as string;
  if (!patientID) {
    throw new AppError(401, "You should log in first!");
  }
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;
  const search = (req.query.search as string)?.trim() || "";
  let filterMyAppointments: any = { patientID };

  if (search.length > 0) {
    const [matchingDoctor, matchingDate] = await Promise.all([
      User.find({
        $or: [
          { first_name: { $regex: search, $options: "i" } },
          { last_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      })
        .select("_id")
        .then((users) =>
          Doctor.find({
            userID: { $in: users.map((user) => user._id) },
          }).select("_id"),
        ),
      DocSlot.find({ date: { $regex: search, $options: "i" } }).select("_id"),
    ]);
    const doctorIds = matchingDoctor.map((docId) => docId._id);
    const slotIds = matchingDate.map((slotId) => slotId._id);
    filterMyAppointments.$or = [
      { doctorID: { $in: doctorIds } },
      { slotID: { $in: slotIds } },
    ];
  }

  const [myAppointments, totalAppointments] = await Promise.all([
    await Appointment.find(filterMyAppointments)
      .skip(skip)
      .limit(limit)
      .populate([
        {
          path: "patientID",
          select: "first_name last_name email avatar phone gender",
        },
        { path: "slotID", select: "date startTime endTime" },
        {
          path: "doctorID",
          select: "specialty address phone consultationFee userID",
          populate: {
            path: "userID",
            select: "first_name last_name email avatar gender",
          },
        },
      ])
      .lean(),
    Appointment.countDocuments(filterMyAppointments),
  ]);

  res.status(200).json({
    success: true,
    message: "fetched your appointments successfully",
    results: myAppointments.length,
    total: totalAppointments,
    page,
    totalPages: Math.ceil(totalAppointments / limit),
    data: myAppointments,
  });
};

export const cancelAppointment = async (req: Request, res: Response) => {
  const patientID = req.user?.id;
  const appointmentID = req.params.appointmentId as string;
  if (!appointmentID) {
    throw new AppError(400, "appointment id is required");
  }
  if (!patientID) {
    throw new AppError(401, "you are unauthenticated");
  }
  const getAppointment = await Appointment.findById(appointmentID).exec();
  if (!getAppointment) {
    throw new AppError(404, "no appointment exist with this id");
  }
  if (getAppointment.patientID.toString() !== patientID) {
    throw new AppError(403, "this not your appointment");
  }
  if (getAppointment.status === "cancelled") {
    throw new AppError(400, "this appointment is already cancelled");
  }
  if (getAppointment.status === "completed") {
    throw new AppError(
      400,
      "you cannot cancel an appointment that already completed",
    );
  }
  const isPaid =
    getAppointment.status === "confirmed" &&
    getAppointment.payment &&
    getAppointment.paymentStatus === "paid" &&
    getAppointment.paymentIntentId;
  if (isPaid) {
    try {
      const stripe = getStripeInstance();
      await stripe.refunds.create({
        payment_intent: getAppointment.paymentIntentId!,
      });
      getAppointment.paymentStatus = "refunded";
      getAppointment.payment = false;
      getAppointment.paymentIntentId = null;
    } catch (error: any) {
      throw new AppError(
        400,
        error.message || "something went wrong please try again later",
      );
    }
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      getAppointment.status = "cancelled";
      await getAppointment.save({ session });
      if (getAppointment.slotID) {
        await DocSlot.findByIdAndUpdate(
          getAppointment.slotID,
          { isBooked: false },
          { session },
        );
      }
    });
  } catch (error: any) {
    throw new AppError(
      400,
      error.message || "something went wrong please try again later",
    );
  } finally {
    await session.endSession();
  }
  res.status(200).json({
    success: true,
    message: "the appointment has been cancelled successfully",
  });
};
