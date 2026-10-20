import type { Request, Response } from "express";
import { getStripeInstance } from "../config/stripe.js";
import { AppError } from "../utils/AppError.js";
import Appointment from "../models/appointmentSchema.js";
import DocSlot from "../models/slotSchema.js";

/**
 * @swagger
 * /payment/webhook:
 *   post:
 *     summary: Handle incoming Stripe webhook events
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Stripe event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 recieved:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing webhook secret key, signature header, or signature verification failed
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const stripe = getStripeInstance();
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  if (!sig || !webhookSecret) {
    return res.status(400).json({
      success: false,
      message:
        "You are Missing webhook secret key in the env file or signature of stripe",
    });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error: any) {
    return res.status(400).send(`webhook Error ${error.message}`);
  }
  if (event?.type === "checkout.session.completed") {
    const session = event.data.object;
    const appointmentID = session.client_reference_id!;
    const paymentIntent = session.payment_intent as string;
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
  return res.status(200).json({
    success: true,
    recieved: true,
  });
};
