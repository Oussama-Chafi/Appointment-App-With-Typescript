import type { Request, Response } from "express";
import { getStripeInstance } from "../config/stripe.js";
import { AppError } from "../utils/AppError.js";
import Appointment from "../models/appointmentSchema.js";
import DocSlot from "../models/slotSchema.js";

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const stripe = getStripeInstance();
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  if (!sig || !webhookSecret) {
    throw new AppError(
      400,
      "You are Missing webhook secret key in the env file or signature of stripe",
    );
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error: any) {
    throw new AppError(400, `Webhook Error: ${error.message}`);
  }
  if (event?.type === "checkout.session.completed") {
    const session = event.data.object;
    const appointmentID = session.client_reference_id;
    const paymentIntent = session.payment_intent;
    if (appointmentID && paymentIntent) {
      await Appointment.findByIdAndUpdate(appointmentID, {
        payment: true,
        paymentStatus: "paid",
        paymentIntentId: paymentIntent,
        status: "confirmed",
      });
    }
  }
  if (event?.type === "checkout.session.async_payment_failed") {
    const session = event.data.object;
    const appointmentID = session.client_reference_id;
    if (appointmentID) {
      await Appointment.findByIdAndUpdate(appointmentID, {
        payment: false,
        paymentStatus: "failed",
        status: "pending",
      });
    }
  }
  if (event?.type === "checkout.session.expired") {
    const session = event.data.object;
    const appointmentID = session.client_reference_id;
    if (appointmentID) {
      const updateAppointment = await Appointment.findByIdAndUpdate(
        appointmentID,
        {
          paymentStatus: "failed",
          status: "cancelled",
        },
      );
      if (updateAppointment?.slotID) {
        await DocSlot.findByIdAndUpdate(
          updateAppointment.slotID,
          {
            isBooked: false,
          },
          { returnDocument: "after", runValidators: true },
        );
      }
    }
  }
  res.status(200).json({
    success: true,
    recieved: true,
  });
};
