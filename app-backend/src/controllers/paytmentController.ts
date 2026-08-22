import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { checkoutSessionVali } from "../validation/paytmentValidation.js";
import Appointment from "../models/appointmentSchema.js";
import { getStripeInstance } from "../config/stripe.js";

export const createCheckoutSession = async (req: Request, res: Response) => {
  const appointmentID = req.params.appointmentId as string;
  if (!appointmentID) {
    throw new AppError(400, "Appointment ID is required");
  }
  const { error } = checkoutSessionVali.validate(req.body);
  if (error) {
    throw new AppError(
      400,
      error.details[0]?.message || "All fields are required!",
    );
  }
  const { doctorName, price } = req.body;
  const getAppointment = await Appointment.findById(appointmentID).lean();
  if (!getAppointment) {
    throw new AppError(404, "Appointment not found.");
  }
  if (price < getAppointment.price) {
    throw new AppError(400, "You should add the right price please.");
  }
  const stripe = getStripeInstance();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: "http://localhost:3000/booking-success",
    cancel_url: "http://localhost:3000/booking-cancel",
    client_reference_id: appointmentID,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `payment of the appointment with Doctor : ${doctorName}`,
          },
          unit_amount: price * 100,
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
