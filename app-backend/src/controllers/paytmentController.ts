import type { Request, Response } from "express";
import { checkoutSessionVali } from "../validation/paytmentValidation.js";
import { AppError } from "../utils/AppError.js";
import { getStripeInstance } from "../config/stripe.js";

export const createCheckoutSession = async (req: Request, res: Response) => {
  const { error } = checkoutSessionVali.validate(req.body);
  if (error) {
    throw new AppError(
      400,
      error.details[0]?.message || "All fields are required!",
    );
  }
  const { appointmentID, doctorName, price } = req.body;
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
