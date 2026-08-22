import { getStripeInstance } from "../config/stripe.js";
import { AppError } from "./AppError.js";
import Stripe from "stripe";

export const generateStripeSession = async (
  doctorName: string,
  appointmentID: string,
  price: number,
): Promise<Stripe.Checkout.Session> => {
  if (!doctorName || !appointmentID || !price) {
    throw new AppError(
      400,
      "doctor name and apppointment id and price is required",
    );
  }
  const stripe = getStripeInstance();
  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: "http://localhost:3000/booking-success",
    cancel_url: "http://localhost:3000/booking-cancel",
    client_reference_id: appointmentID,
    expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
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
};
