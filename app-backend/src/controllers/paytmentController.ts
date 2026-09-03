import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { Types } from "mongoose";
import Appointment from "../models/appointmentSchema.js";
import { getStripeInstance } from "../config/stripe.js";

export const createCheckoutSession = async (req: Request, res: Response) => {
  const appointmentID = req.params.appointmentId as string;
  if (!appointmentID || !Types.ObjectId.isValid(appointmentID)) {
    throw new AppError(400, "Valid Appointment ID is required ");
  }
  const userId = req.user?.id as string;
  const getAppointment = await Appointment.findById(appointmentID)
    .populate({
      path: "doctorID",
      select: "userID",
      populate: { path: "userID", select: "first_name last_name" },
    })
    .lean();
  if (!getAppointment) {
    throw new AppError(404, "No appointment exist with this ID");
  }
  if (getAppointment.patientID.toString() !== userId) {
    throw new AppError(403, "You can't pay this appointment");
  }
  const doctor = getAppointment.doctorID as any;
  const doctorName = doctor?.userID
    ? `${doctor.userID.first_name} ${doctor.userID.last_name}`
    : "Doctor";
  const client_url =
    (process.env.CLIENT_URL as string) || "http://localhost:3000";
  const stripe = getStripeInstance();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${client_url}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${client_url}/booking-cancel`,
    client_reference_id: appointmentID,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `payment of the appointment with Doctor : ${doctorName}`,
          },
          unit_amount: getAppointment.price * 100,
        },
        quantity: 1,
      },
    ],
  });
  res.status(200).json({
    success: true,
    url: session.url,
  });
};
