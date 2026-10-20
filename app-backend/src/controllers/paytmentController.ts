import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { Types } from "mongoose";
import Appointment from "../models/appointmentSchema.js";
import { getStripeInstance } from "../config/stripe.js";

/**
 * @swagger
 * /payment/checkout-session/{appointmentId}:
 *   post:
 *     summary: Create a Stripe checkout session for an appointment payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the appointment to pay for
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   example: "https://checkout.stripe.com/c/pay/cs_test_..."
 *       400:
 *         description: Valid Appointment ID is required
 *       401:
 *         description: You are unauthenticated
 *       403:
 *         description: You can't pay this appointment (Unauthorized user)
 *       404:
 *         description: No appointment exist with this ID
 */
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
