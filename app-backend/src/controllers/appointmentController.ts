import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import DocSlot from "../models/slotSchema.js";
import Appointment from "../models/appointmentSchema.js";
import User from "../models/userSchema.js";
import { Doctor } from "../models/doctorSchema.js";
import { getStripeInstance } from "../config/stripe.js";
import { generateStripeSession } from "../utils/stripeService.js";

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
    throw new AppError(404, "This slot does not exist or has already been booked");
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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const search = (req.query.search as string)?.trim() || "";
  let filterMyAppointments: any = { patientID };

  if (search.length > 0) {
    const matchingUser = await User.find({
      $or: [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    const userID = matchingUser.map((user) => user._id);
    const matchingDoctor = await Doctor.find({ userID: { $in: userID } });

    const doctorIds = matchingDoctor.map((doc) => doc._id);

    const matchingDate = await DocSlot.find({
      date: {
        $regex: search,
        $options: "i",
      },
    }).select("_id");

    const slotIds = matchingDate.map((date) => date._id);

    filterMyAppointments.$or = [
      { doctorID: { $in: doctorIds } },
      { slotID: { $in: slotIds } },
    ];
  }

  const myAppointment = await Appointment.find(filterMyAppointments)
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
    .lean();
  if (myAppointment.length === 0) {
    throw new AppError(404, "You don't have any Appointments in this Time.");
  }

  res.status(200).json({
    success: true,
    message: "This is all your Appointments",
    AppointmentsLength: myAppointment.length,
    data: myAppointment,
  });
};

export const cancelAppointment = async (req: Request, res: Response) => {
  const appointmentID = req.params.appointmentID as string;
  if (!appointmentID) {
    throw new AppError(400, "Please add ID of this Appointment");
  }
  const getAppointment = await Appointment.findById(appointmentID).exec();
  if (!getAppointment) {
    throw new AppError(404, "There is no Appointment with this ID!");
  }
  const patientID = req.user?.id;
  if (!patientID) {
    throw new AppError(401, "you should log in first.");
  }
  if (getAppointment.patientID.toString() !== patientID) {
    throw new AppError(
      403,
      "You don't have The Premission to cancel this Appointment.",
    );
  }
  if (getAppointment.status !== "cancelled") {
    if (getAppointment.payment && getAppointment.paymentIntentId) {
      try {
        const stripe = getStripeInstance();
        await stripe.refunds.create({
          payment_intent: getAppointment.paymentIntentId,
        });
        getAppointment.paymentStatus = "refunded";
      } catch (error: any) {
        throw new AppError(400, `Refund faild: ${error.message}`);
      }
    }
    getAppointment.status = "cancelled";
    await getAppointment.save();
    await DocSlot.findByIdAndUpdate(getAppointment.slotID, {
      isBooked: false,
    });
  } else {
    throw new AppError(400, "This Appointment is already cancelled.");
  }

  res.status(200).json({
    success: true,
    message: "The Appointment has been cancelled successfully.",
  });
};
