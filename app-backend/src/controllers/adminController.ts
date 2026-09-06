import { type Request, type Response } from "express";
import { Doctor } from "../models/doctorSchema.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";
import Appointment from "../models/appointmentSchema.js";
import DocSlot from "../models/slotSchema.js";
import { getStripeInstance } from "../config/stripe.js";
import mongoose, { Types } from "mongoose";

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
    results: pendingRequest.length,
    pendingRequest,
  });
};

export const updateDoctorStatus = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;

  if (!id || !Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid ID format");
  }
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
    await User.findByIdAndUpdate(findDocReq.userID, {
      role: "doctor",
    }).lean();

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
      message: " Doctor request has been rejected and deleted.",
    });
  }
};

export const getAllPatients = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;
  const search = (req.query.search as string)?.trim() || "";

  const searchQuery = {
    role: "patient" as const,
    ...(search.length > 0 && {
      $or: [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }),
  };

  const [getPatients, totalPatient] = await Promise.all([
    User.find(searchQuery).select("-password").skip(skip).limit(limit).lean(),
    User.countDocuments(searchQuery),
  ]);
  res.status(200).json({
    success: true,
    results: getPatients.length,
    total: totalPatient,
    totalPages: Math.ceil(totalPatient / limit),
    page,
    data: getPatients,
  });
};

export const getAllDoctors = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;
  const search = (req.query.search as string)?.trim() || "";
  let filterDoctor = {};

  if (search.length > 0) {
    const matchingUser = await User.find({
      $or: [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    })
      .select("_id")
      .lean();
    filterDoctor = {
      $or: [
        { userID: { $in: matchingUser.map((user) => user._id) } },
        { specialty: { $regex: search, $options: "i" } },
      ],
    };
  }
  const [getDoctors, totalDoctors] = await Promise.all([
    Doctor.find(filterDoctor)
      .skip(skip)
      .lean()
      .limit(limit)
      .populate(
        "userID",
        "first_name last_name email gender avatar phone role isBlocked isVerified",
      ),
    Doctor.countDocuments(filterDoctor),
  ]);
  res.status(200).json({
    success: true,
    message: "All Doctors",
    results: getDoctors.length,
    total: totalDoctors,
    totalPages: Math.ceil(totalDoctors / limit),
    page,
    data: getDoctors,
  });
};

export const getAppointments = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(10, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;
  const search = (req.query.search as string)?.trim() || "";
  let queryFilter = {};

  if (search.length > 0) {
    const [matchingUser, matchingDate] = await Promise.all([
      User.find({
        $or: [
          { first_name: { $regex: search, $options: "i" } },
          { last_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id"),
      DocSlot.find({
        date: { $regex: search, $options: "i" },
      }).select("_id"),
    ]);
    const userIDs = matchingUser.map((user) => user._id);
    const dateIDs = matchingDate.map((date) => date._id);

    const matchingDoctor = await Doctor.find({
      userID: { $in: userIDs.map((user) => user._id) },
    }).select("_id").lean();
    const docIDs = matchingDoctor.map((doc) => doc._id);

    queryFilter = {
      $or: [
        { patientID: { $in: userIDs } },
        { doctorID: { $in: docIDs } },
        { slotID: { $in: dateIDs } },
      ],
    };
  }

  const [getAppointments, totalAppointments] = await Promise.all([
    await Appointment.find(queryFilter)
      .skip(skip)
      .limit(limit)
      .populate([
        {
          path: "patientID",
          select: "first_name last_name email phone gender avatar phone isVerified isBlocked",
        },
        { path: "slotID", select: "date startTime endTime isBooked" },
        {
          path: "doctorID",
          select:
            "address phone specialty consultationFee isAcceptingAppointments status averageRating numOfReviews userID",
          populate: {
            path: "userID",
            select: "first_name last_name email avatar gender phone ",
          },
        },
      ]),
    Appointment.countDocuments(queryFilter),
  ]);
  res.status(200).json({
    success: true,
    message: "This all appointments in the app",
    result: getAppointments.length,
    totalPages: Math.ceil(totalAppointments / limit),
    page,
    data: getAppointments,
  });
};

export const cancelAppointmentByAdmin = async (req: Request, res: Response) => {
  const appointmentID = req.params.appointmentId as string;

  if (!appointmentID || !Types.ObjectId.isValid(appointmentID)) {
    throw new AppError(400, "Valid appointment id is required");
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
    message:
      "the appointment has been cancelled successfully and refunded if paid",
  });
};

export const updateRoleOfUser = async (req: Request, res: Response) => {
  const userID = req.params.userId as string;
  const { newRole } = req.body;
  if (!newRole || !["user", "doctor", "admin"].includes(newRole)) {
    throw new AppError(
      400,
      "Please provide a valid role (patient, doctor, or admin)",
    );
  }
  if (!userID || !Types.ObjectId.isValid(userID)) {
    throw new AppError(400, "Valid user ID is required");
  }
  const updateUser = await User.findByIdAndUpdate(
    userID,
    {
      role: newRole,
    },
    { returnDocument: "after", runValidators: true },
  ).select("-password");
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
  if (!userID || !Types.ObjectId.isValid(userID)) {
    throw new AppError(400, "Valid user ID is required");
  }
  if (typeof isBlocked !== "boolean") {
    throw new AppError(400, "Please provide isBlocked as a boolean");
  }
  const getUser = await User.findById(userID).exec();
  if (!getUser) {
    throw new AppError(404, "Account profile not found");
  }
  if (getUser.role === "admin") {
    throw new AppError(403, "You cannot block an admin");
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
  if (!userID || Types.ObjectId.isValid(userID)) {
    throw new AppError(400, "Valid user ID is required");
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
