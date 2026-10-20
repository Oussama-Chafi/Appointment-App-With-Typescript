import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import DocSlot from "../models/slotSchema.js";
import Appointment from "../models/appointmentSchema.js";
import User from "../models/userSchema.js";
import { Doctor } from "../models/doctorSchema.js";
import { getStripeInstance } from "../config/stripe.js";
import { generateStripeSession } from "../utils/stripeService.js";
import mongoose, { Types } from "mongoose";

/**
 * @swagger
 * /appointment/book/{slotID}:
 *   post:
 *     summary: Book an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotID
 *         schema:
 *           type: string
 *           example: 6aa9d8cf51da0972b69ead8a
 *         description: Slot id so we can find the slot
 *     responses:
 *       201:
 *         description: means that appointment created successsfully with also link for payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messsage:
 *                   type: string
 *                   example: "Appointment created successsfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: If slot id wan't valid or if something happens when we save appointment or when we create a session for the payment
 *       404:
 *         description: If this slot not found with this id or if it's already booked
 *       403:
 *         description: If the token was invalid
 */
export const bookAppointment = async (req: Request, res: Response) => {
  const slotID = req.params.slotID as string;
  const patientID = req.user?.id;
  if (!slotID || !Types.ObjectId.isValid(slotID)) {
    throw new AppError(400, "Slot ID is required!");
  }
  if (!patientID) {
    throw new AppError(401, "User ID is required!");
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
    const doctorName = `${doctor.userID?.first_name} ${doctor.userID?.last_name}`;
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

/**
 * @swagger
 * /appointment/my-appointments:
 *   get:
 *     summary: Get all my appointments with pagination and search
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of limit per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "2026-10-16"
 *         description: Search by appointment date, doctor name or doctor email.
 *     responses:
 *       200:
 *         description: All appointments that retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messsage:
 *                   type: string
 *                   example: "fetched your appointments successfully"
 *                 results:
 *                   type: integer
 *                   example: 1
 *                 total:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Forbidden, token was invalid
 */
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

/**
 * @swagger
 * /appointment/cancel-appointment/{appointmentId}:
 *   post:
 *     summary: Cancel an appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *           example: "6aa9d8cf51da0972b69ead8a"
 *         description: Appointment id to find in db
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "the appointment has been cancelled successfully"
 *       400:
 *         description: Bad request (invalid ID, already cancelled, or completed)
 *       401:
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, accesstoken was invalid or if this appointment was for another patient
 *       404:
 *         description: Appointment not found
 */
export const cancelAppointment = async (req: Request, res: Response) => {
  const patientID = req.user?.id;
  const appointmentID = req.params.appointmentId as string;
  if (!appointmentID || !Types.ObjectId.isValid(appointmentID)) {
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
