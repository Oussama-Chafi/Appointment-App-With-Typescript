import { type Request, type Response } from "express";
import { Doctor } from "../models/doctorSchema.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/userSchema.js";
import Appointment from "../models/appointmentSchema.js";
import DocSlot from "../models/slotSchema.js";
import { getStripeInstance } from "../config/stripe.js";
import mongoose, { Types } from "mongoose";

/**
 * @swagger
 * /admin/doctor-requests:
 *   get:
 *     summary: Get all pending doctor requests with pagination and search (Admin only)
 *     tags: [Admin]
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
 *           example: "cardio"
 *         description: Search by doctor name, email, or specialty
 *     responses:
 *       200:
 *         description: Pending doctor requests retrieved successfully
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
 *                   example: "This is all requests in this time"
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
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not an admin
 */
export const getPendingDoctorRequest = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const search = (req.query.search as string)?.trim() || "";
  const skip = (page - 1) * limit;

  let searchQuery: any = {
    status: "pending" as const,
  };

  if (search.length > 0) {
    const getUsers = await User.find({
      $or: [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    const userIDs = getUsers.map((user) => user._id);
    searchQuery.$or = [
      { userID: { $in: userIDs } },
      { specialty: { $regex: search, $options: "i" } },
    ];
  }

  const [pendingRequest, totalPendingRequest] = await Promise.all([
    Doctor.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .populate("userID", "first_name last_name email phone gender avatar role")
      .exec(),
    Doctor.countDocuments(searchQuery),
  ]);

  if (pendingRequest.length === 0) {
    return res.status(200).json({
      success: true,
      message: "There is no Requests in this Time.",
    });
  }
  res.status(200).json({
    success: true,
    message: "This is all requests in this time",
    results: pendingRequest.length,
    total: totalPendingRequest,
    totalPages: Math.ceil(totalPendingRequest / limit),
    page,
    data: pendingRequest,
  });
};

/**
 * @swagger
 * /admin/doctor-requests/{id}/status:
 *   patch:
 *     summary: Update the status of this doctor to approved or rejected (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *           example: 6aa9d8cf51da0972b69ead8a
 *         description: id string should be an available objectId in mongoose
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: "'approved' or 'rejected'"
 *     responses:
 *       200:
 *         description: "Doctor request has been successfully {status}, if he's approved:"
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
 *                   example: "Doctor request has been successfully approved"
 *                 data:
 *                   type: object
 *       400:
 *         description: "If the status wasn't approved or rejected and also if the id wasn't available"
 *       404:
 *         description: "If doctor request not found "
 *       403:
 *         description: Forbidden, user is not an admin
 */
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
      "first_name last_name email avatar phone gender role",
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

/**
 * @swagger
 * /admin//all-patients:
 *   get:
 *     summary: Get all patients with pagination and search (Admin only)
 *     tags: [Admin]
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
 *           example: "patient_name"
 *         description: Search by patient name or email
 *     responses:
 *       200:
 *         description: All patients that retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
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
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not an admin
 */
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

/**
 * @swagger
 * /admin/all-doctors:
 *   get:
 *     summary: Get all doctors with pagination and search (Admin only)
 *     tags: [Admin]
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
 *           example: "doctor_name"
 *         description: Search by doctor name, email, or specialty
 *     responses:
 *       200:
 *         description: All doctors that retrieved successfully
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
 *                   example: "All doctors"
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
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not an admin
 */
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

/**
 * @swagger
 * /admin/all-appointments:
 *   get:
 *     summary: Get all appointments with pagination and search (Admin only)
 *     tags: [Admin]
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
 *         description: Search by appointment date, doctor name , doctor email , patient name , or patient email
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
 *                   example: "This all appointments in the app"
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
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not an admin
 */
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
    })
      .select("_id")
      .lean();
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
          select:
            "first_name last_name email phone gender avatar phone isVerified isBlocked",
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
    total: totalAppointments,
    totalPages: Math.ceil(totalAppointments / limit),
    page,
    data: getAppointments,
  });
};

/**
 * @swagger
 * /admin/cancel-appointment/{appointmentId}:
 *   patch:
 *     summary: Cancel an appointment by ID (Admin only)
 *     tags: [Admin]
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
 *                   example: "the appointment has been cancelled successfully and refunded if paid"
 *       400:
 *         description: Bad request (invalid ID, already cancelled, or completed)
 *       401:
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not an admin
 *       404:
 *         description: Appointment not found
 */
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

/**
 * @swagger
 * /admin/delete-slot/{slotID}":
 *   delete:
 *     summary: Delete one slot (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotID
 *         required: true
 *         schema:
 *           type: string
 *           example: "6aa9d8cf51da0972b69ead8a"
 *         description: Slot id to find in db
 *     responses:
 *       204:
 *         description: Slot has been deleted successfully
 *       400:
 *         description: If this slot already booked or if the slot id is invalid
 *       401:
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not an admin
 *       404:
 *         description: If the slot not found
 *
 */
export const deleteOneSlotByAdmin = async (req: Request, res: Response) => {
  const slotID: string = req.params.slotID as string;
  if (!slotID || !Types.ObjectId.isValid(slotID)) {
    throw new AppError(400, "Valid slot id is required");
  }
  const getSlot = await DocSlot.findById(slotID).lean();
  if (!getSlot) {
    throw new AppError(404, "Slot not found");
  }
  if (getSlot.isBooked) {
    throw new AppError(400, "Cannot delete a slot that is already booked!");
  }
  await DocSlot.findByIdAndDelete(slotID);
  res.status(204).send();
};

/**
 * @swagger
 * /admin/delete-many-slots:
 *   delete:
 *     summary: Delete many slots in the same time (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotIDs
 *             properties:
 *               slotIDs:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "'6aa9d8cf51da0972b69ead8a' , '6aa9d8cf51da0972b69ead8b'"
 *     responses:
 *       200:
 *         description: Slots has been deleted successfully
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
 *                   example: "{Number of slots} slots deleted successfully"
 *       400:
 *         description: If {slotIDs} wasn't an array , if an id is invalid or if the slots are already booked
 *       401:
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not an admin
 */
export const deleteManySlotsByAdmin = async (req: Request, res: Response) => {
  const slotIDs: string[] = req.body.slotIDs as string[];
  if (!Array.isArray(slotIDs) || slotIDs.length === 0) {
    throw new AppError(400, "Please provide an array of slots IDs to delete");
  }
  const hasInvalidId = slotIDs.some(
    (id: string) => !Types.ObjectId.isValid(id),
  );

  if (hasInvalidId) {
    throw new AppError(400, "One or more provided slot IDs are invalid");
  }
  const getSlotIds = slotIDs.map((id: string) => new Types.ObjectId(id));
  const result = await DocSlot.deleteMany({
    _id: { $in: getSlotIds },
    isBooked: false,
  });
  if (result.deletedCount === 0) {
    throw new AppError(
      400,
      "No eligible unbooked slots were found to delete or you are not authorized to delete them.",
    );
  }
  res.status(200).json({
    success: true,
    message: `${result.deletedCount} slots deleted successfully`,
  });
};

/**
 * @swagger
 * /admin/update-role/{userId}:
 *   patch:
 *     summary: update the role of an user or a doctor(Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           example: 6aa9d8cf51da0972b69ead8a
 *         description: user id so we can find him in db
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newRole
 *             properties:
 *               newRole:
 *                 type: string
 *                 example: "'admin' , 'doctor' , 'patient'"
 *     responses:
 *       200:
 *         description:
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
 *                   example: "The role has been updated successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: If the role is not admin , doctor , patient
 *       404:
 *         description: If the account not found with this id
 *       401:
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not an admin
 */
export const updateRoleOfUser = async (req: Request, res: Response) => {
  const userID = req.params.userId as string;
  const { newRole } = req.body;
  if (!newRole || !["patient", "doctor", "admin"].includes(newRole)) {
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
    data: updateUser,
  });
};

/**
 * @swagger
 * /admin/block-user/{userId}:
 *   patch:
 *     summary: Block an account or remove the block (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           example: 6aa9d8cf51da0972b69ead8a
 *         description: user id so we can find him in db
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isBlocked
 *             properties:
 *               isBlocked:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description:
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
 *                   example: "User has been successfully blocked"
 *                 data:
 *                   type: object
 *       400:
 *         description: If user ID wasn't invalid or if isBlocked is not a boolean value
 *       404:
 *         description: If the account not found with this id
 *       401:
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not an admin, or if the admin try to block another admin
 */
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

/**
 * @swagger
 * /admin/delete-account/{userId}:
 *   delete:
 *     summary: Delete an account (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           example: 6aa9d8cf51da0972b69ead8a
 *         description: user id so we can find him in db
 *     responses:
 *       200:
 *         description: Account has been deleted successfully
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
 *                   example: "Account has been deleted successfully"
 *
 *       400:
 *         description: If user ID wasn't invalid
 *       404:
 *         description: If the account not found with this id
 *       401:
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not an admin, or if the admin try to delete another admin
 */
export const deleteAnAccount = async (req: Request, res: Response) => {
  const userID = req.params.userId as string;
  if (!userID || !Types.ObjectId.isValid(userID)) {
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
