import { type Request, type Response } from "express";
import { Doctor } from "../models/doctorSchema.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";
import Appointment from "../models/appointmentSchema.js";
import DocSlot from "../models/slotSchema.js";
import { getStripeInstance } from "../config/stripe.js";
import mongoose from "mongoose";
export const getPendingDoctorRequest = async (req: Request, res: Response) => {
  const pendingRequest = await Doctor.find({ status: "pending" })
    .populate("userID", "first_name last_name email phone gender avatar")
    .exec();
  if (pendingRequest.length === 0) {
    return res.status(200).json({
      success: true,
      message: "There is no Requests in this Time.",
    });
  }
  res.status(200).json({
    success: true,
    message: "This is all requests in DB",
    pendingRequest,
  });
};

export const updateDoctorStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    throw new AppError(400, "Invalid status parameter");
  }
  const findDocReq = await Doctor.findById(id).exec();

  if (!findDocReq) {
    throw new AppError(404, "This Account is not exist enymore !");
  }
  if (status === "approved") {
    findDocReq.status = status;
    await findDocReq.save();
    const updateRole = await User.findByIdAndUpdate(findDocReq.userID, {
      role: "doctor",
    });

    await findDocReq.populate(
      "userID",
      "first_name last_name email avatar phone gender",
    );

    return res.status(200).json({
      success: true,
      message: `Doctor request has been successfully ${status}`,
      data: findDocReq,
    });
  } else {
    await Doctor.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: " This request has been deleteModel.",
    });
  }
};

export const getAllPatients = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const search = (req.query.search as string) || "";

  const getPatients = await User.find({
    role: "patient",
    $or: [
      { first_name: { $regex: search, $options: "i" } },
      { last_name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ],
  })
    .select("-password")
    .skip(skip)
    .limit(limit)
    .exec();
  res.status(200).json({
    success: true,
    message: "This is all patients in the app",
    patientLength: getPatients.length,
    getPatients,
  });
};

export const getAllDoctors = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const search = (req.query.search as string) || "";
  let filterDoctor = {};

  if (search.length > 0) {
    const matchingUser = await User.find({
      $or: [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    const userIDs = matchingUser.map((user) => user._id);
    filterDoctor = { userID: { $in: userIDs } };
  }

  const getDoctors = await Doctor.find(filterDoctor)
    .skip(skip)
    .limit(limit)
    .populate("userID", "first_name last_name email avatar gender")
    .exec();
  res.status(200).json({
    success: true,
    message: "This is all doctors in the app",
    doctorLength: getDoctors.length,
    getDoctors,
  });
};

export const getAppointments = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const search = (req.query.search as string) || "";
  let queryFilter = {};

  if (search.length > 0) {
    const matchingUser = await User.find({
      $or: [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    const userIDs = matchingUser.map((user) => user._id);

    const matchnigDate = await DocSlot.find({
      date: {
        $regex: search,
        $options: "i",
      },
    }).select("_id");
    const dates = matchnigDate.map((date) => date._id);
    queryFilter = {
      $or: [
        { patientID: { $in: userIDs } },
        { doctorID: { $in: userIDs } },
        { slotID: { $in: dates } },
      ],
    };
  }

  const getAppointment = await Appointment.find(queryFilter)
    .skip(skip)
    .limit(limit)
    .populate([
      { path: "patientID", select: "first_name last_name email phone gender" },
      { path: "slotID", select: "date startTime endTime isBooked" },
      {
        path: "doctorID",
        select:
          "address phone specialty consultationFee isAcceptingAppointments status averageRating numOfReviews userID",
        populate: {
          path: "userID",
          select: "first_name last_name email avatar gender",
        },
      },
    ]);
  res.status(200).json({
    success: true,
    message: "This all appointments in the app",
    appointmentsLength: getAppointment.length,
    getAppointment,
  });
};

export const cancelAppointmentByAdmin = async (req: Request, res: Response) => {
  const appointmentID = req.params.appointmentId as string;

  if (!appointmentID) {
    throw new AppError(400, "appointment id is required");
  }
  const getAppointment = await Appointment.findById(appointmentID).exec();
  if (!getAppointment) {
    throw new AppError(404, "appointment not found");
  }
  if (getAppointment.status === "cancelled") {
    throw new AppError(400, "this appointment is already cancelled");
  }
  if (getAppointment.status === "completed") {
    throw new AppError(
      400,
      "you cannot cancel an appointment has already completed",
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
        error.message || "seomthing went wrong please try again later",
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
      error.message || "seomthing went wrong please try again later",
    );
  } finally {
    await session.endSession();
  }
  res.status(200).json({
    success: true,
    message: "the appointment has been cancelled successfully",
  });
};

export const updateRoleOfUser = async (req: Request, res: Response) => {
  const userID = req.params.userId as string;
  const { newRole } = req.body;
  if (!newRole || !["user", "doctor", "admin"].includes(newRole)) {
    throw new AppError(400, "Please the role");
  }
  if (!userID) {
    throw new AppError(400, "user ID is required");
  }
  const updateUser = await User.findByIdAndUpdate(
    userID,
    {
      role: newRole,
    },
    { returnDocument: "after", runValidators: true },
  );
  if (!updateUser) {
    throw new AppError(404, "Account profile not found");
  }
  res.status(200).json({
    success: true,
    message: "The role has been updated successfully",
    updateUser,
  });
};

export const toggleBlockUser = async (req: Request, res: Response) => {
  const userID = req.params.userId as string;
  const { isBlocked } = req.body;
  if (!userID) {
    throw new AppError(400, "User ID is required");
  }
  const getUser = await User.findById(userID).exec();
  if (!getUser) {
    throw new AppError(404, "Account profile not found");
  }
  if (getUser.role === "admin") {
    throw new AppError(403, "You cannot block an admin");
  }

  if (typeof isBlocked !== "boolean") {
    throw new AppError(400, "Please provide isBlocked as a boolean");
  }

  getUser.isBlocked = isBlocked;
  getUser.tokenVersion++;
  await getUser.save();

  res.status(200).json({
    success: true,
    message: `User has been successfully ${isBlocked ? "blocked" : "unblocked"}.`,
    data: getUser,
  });
};

export const deleteAnAccount = async (req: Request, res: Response) => {
  const userID = req.params.userId as string;
  if (!userID) {
    throw new AppError(400, "User ID is required");
  }
  const getUser = await User.findById(userID).lean();
  if (!getUser) {
    throw new AppError(404, "Account Profile not found");
  }
  if (getUser.role === "admin") {
    throw new AppError(403, "You cannot delete yourself or delete an admin");
  }
  if (getUser.role === "doctor") {
    await Doctor.findOneAndDelete({ userID });
  }
  await User.findByIdAndDelete(userID);
  res.status(200).json({
    success: true,
    message: "Account has been deleted successfully",
  });
};
