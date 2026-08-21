import { type Request, type Response } from "express";
import { Doctor } from "../models/doctorSchema.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";
import Appointment from "../models/appointmentSchema.js";
import DocSlot from "../models/slotSchema.js";

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

// export const
