import { type Request, type Response } from "express";
import { Doctor } from "../models/doctorSchmea.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";

export const getPendingDoctorRequest = async (req: Request, res: Response) => {
  const pendingRequest = await Doctor.find({ status: "pending" })
    .populate("userID", "first_name last_name email ")
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
