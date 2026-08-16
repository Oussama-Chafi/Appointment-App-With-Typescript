import { type Request, type Response } from "express";
import { getStripeInstance } from "../config/stripe.js";
import { AppError } from "../utils/AppError.js";
import Appointment from "../models/appointmentSchema.js";

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const stripe = getStripeInstance();
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    throw new AppError(400, "Missing stripe signature or secret");
  }
  let event;
  event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const appointmentID = session.client_reference_id;
    if (appointmentID) {
      await Appointment.findByIdAndUpdate(appointmentID, {
        payment: true,
        status: "confirmed",
      });
      console.log(`Appointment ${appointmentID} payment confirmed`);
    }
  }
  res.status(200).json({
    success: true,
    recieved: true,
  });
};
