import type { Request, Response } from "express";
import {
  addDoctorSlotsVali,
  applyAsDoctorVali,
} from "../validation/doctorValidation.js";
import { AppError } from "../utils/AppError.js";
import { Doctor } from "../models/doctorSchema.js";
import DocSlot from "../models/slotSchema.js";
import Appointment from "../models/appointmentSchema.js";
import { Types } from "mongoose";
import User from "../models/userSchema.js";

/**
 * @swagger
 * /doctors/app-as-doctor:
 *   post:
 *     summary: Send a request to be a doctor
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - consultationFee
 *               - specialty
 *               - phone
 *             properties:
 *               address:
 *                 type: string
 *                 example: "address_example"
 *               consultationFee:
 *                 type: number
 *                 example: 50
 *               specialty:
 *                 type: string
 *                 example: "specialty_example"
 *               phone:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       201:
 *         description: "Request has been successfully submitted"
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
 *                   example: "Your application has been successfully submitted, and is under review."
 *                 data:
 *                   type: object
 *       400:
 *         description: If any field was not acceptable or if this user has already sent a request
 *       401:
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not an admin
 */
export const applyAsDoctor = async (req: Request, res: Response) => {
  const { error, value } = applyAsDoctorVali.validate(req.body);
  if (error) {
    throw new AppError(
      400,
      error.details[0]?.message || "You should add all Informations !",
    );
  }
  const { address, consultationFee, specialty, phone } = value;
  const userID = req.user?.id;
  if (!userID) {
    throw new AppError(401, "User is not authenticated");
  }
  const existingRequest = await Doctor.findOne({ userID }).lean();
  if (existingRequest) {
    throw new AppError(400, " you have already send a Request");
  }

  const newDoctorRequest = await Doctor.create({
    userID,
    address,
    consultationFee,
    specialty,
    phone,
    // status : "pending"
  });

  await newDoctorRequest.populate(
    "userID",
    "first_name last_name email avatar phone gender",
  );

  res.status(201).json({
    success: true,
    message:
      "your application has been successfully submitted, and is under review.",
    data: newDoctorRequest,
  });
};

/**
 * @swagger
 * /doctors/add-slots:
 *   post:
 *     summary: Adding slots in the app (Doctors only)
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *               - endTime
 *               - price
 *               - excludedSlots
 *             properties:
 *               date:
 *                 type: string
 *                 example: "2026-10-10"
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "16:00"
 *               price:
 *                 type: number
 *                 example: 50
 *               excludedSlots:
 *                 type: array
 *                 example: "12:00"
 *     responses:
 *       201:
 *         description: "means that Slots created Successfully."
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
 *                   example: "Slots created Successfully."
 *                 slotLength:
 *                   type: number
 *                   example: 7
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: If any field is missing or if the doc try to create slot in past date or if the start time higher than end time
 *       401:
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not a doctor
 */
export const addDoctorSlots = async (req: Request, res: Response) => {
  const { error } = addDoctorSlotsVali.validate(req.body);
  if (error) {
    throw new AppError(
      400,
      error.details[0]?.message || "All fields are required!",
    );
  }
  const { date, startTime, endTime, price, excludedSlots } = req.body;
  const doctorID = req.user?.id;
  if (!doctorID) {
    throw new AppError(401, "You are unauthenticated.");
  }
  const findDoc = await Doctor.findOne({ userID: doctorID });
  if (!findDoc) {
    throw new AppError(404, "Doctor Profile not found.");
  }
  const currentDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(currentDate.getTime()) || currentDate < today) {
    throw new AppError(400, "Cannot create slots to past dates!");
  }
  const slotsToInsert = [];
  let startHour = parseInt(startTime.split(":")[0]);
  let endHour = parseInt(endTime.split(":")[0]);
  if (startHour >= endHour) {
    throw new AppError(400, "The start time must be earlier than the end time");
  }
  const safeExcludedSlotsArray = Array.isArray(excludedSlots)
    ? excludedSlots
    : [];

  while (startHour < endHour) {
    const slotStart = `${startHour.toString().padStart(2, "0")}:00`;
    const slotEnd = `${(startHour + 1).toString().padStart(2, "0")}:00`;
    if (!safeExcludedSlotsArray.includes(slotStart)) {
      slotsToInsert.push({
        doctorID: findDoc._id,
        date,
        startTime: slotStart,
        endTime: slotEnd,
        price,
      });
    }
    startHour++;
  }
  const createSlots = await DocSlot.insertMany(slotsToInsert);
  await DocSlot.populate(createSlots, {
    path: "doctorID",
    select: "phone specialty address consultationFee userID",
    populate: {
      path: "userID",
      select: "first_name last_name email avatar gender",
    },
  });

  res.status(201).json({
    success: true,
    message: "Slots created Successfully.",
    slotsLength: createSlots.length,
    data: createSlots,
  });
};

/**
 * @swagger
 * /doctors/all-doctors:
 *   get:
 *     summary: Get all doctors with pagination and search
 *     tags: [Doctor]
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
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Access token invaled.
 */
export const allDoctors = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;
  const search = (req.query.search as string)?.trim() || "";
  let filterDoctors: any = {};

  if (search.length > 0) {
    const getDoctor = await User.find({
      $or: [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    const userIds = getDoctor.map((user) => user._id);
    filterDoctors.$or = [
      { userID: { $in: userIds } },
      { specialty: { $regex: search, $options: "i" } },
    ];
  }
  const [doctors, totalDoctors] = await Promise.all([
    Doctor.find(filterDoctors)
      .skip(skip)
      .limit(limit)
      .populate("userID", "first_name last_name email avatar gender"),
    Doctor.countDocuments(filterDoctors),
  ]);
  res.status(200).json({
    success: true,
    message: "Doctors retrieved successfully",
    results: doctors.length,
    total: totalDoctors,
    page,
    totalPages: Math.ceil(totalDoctors / limit),
    data: doctors,
  });
};

/**
 * @swagger
 * /doctors/available-slots/{doctorId}:
 *   get:
 *     summary: Get all available slots for one doctor with pagination and search query
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *           example: "6aa9d8cf51da0972b69ead8a"
 *         description: Doctor id to get his slots
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
 *           example: "2026-10-10"
 *         description: Search for a slot by date
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
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
 *                   example: "Available slots"
 *                 results:
 *                   type: integer
 *                   example: 1
 *                 total:
 *                   type: integer
 *                   example: 1
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: If doctor id in params is invalid.
 *       401:
 *         description: Unauthenticated, token missing or invalid.
 *       403:
 *         description: Access token invalid.
 *       404:
 *         description: Doctor Profile not found.
 */
export const getAvailableSlots = async (req: Request, res: Response) => {
  const doctorID = (req.params.doctorId as string).trim();
  if (!doctorID || !Types.ObjectId.isValid(doctorID)) {
    throw new AppError(400, " Doctor ID is required");
  }
  const findDoc = await Doctor.findById(doctorID).lean();
  if (!findDoc) {
    throw new AppError(404, "Doctor profile not found ");
  }
  const page = Math.max(1, parseInt(req.params.page as string) || 1);
  const limit = Math.max(1, parseInt(req.params.limit as string) || 10);
  const skip = (page - 1) * limit;
  const search = (req.query.search as string)?.trim() || "";
  const today = new Date().toISOString().split("T")[0] as string;
  const searchFilter: any = {
    doctorID,
    isBooked: false,
    date: { $gte: today },
  };

  if (search.length > 0) {
    searchFilter.date = {
      $gte: today,
      $regex: search,
      $options: "i",
    };
  }

  const [availableSlots, totalSlots] = await Promise.all([
    DocSlot.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .populate([
        {
          path: "doctorID",
          select:
            "speciality phone address consultationFee isAcceptingAppointments averageRating numOfReviews userID",
          populate: {
            path: "userID",
            select: "first_name last_name email avatar gender",
          },
        },
      ]),
    DocSlot.countDocuments(searchFilter),
  ]);

  res.status(200).json({
    success: true,
    message: "Availabel slots",
    results: availableSlots.length,
    total: totalSlots,
    page,
    totalPages: Math.ceil(totalSlots / limit),
    data: availableSlots,
  });
};

/**
 * @swagger
 * /doctors/delete-slot/{slotID}":
 *   delete:
 *     summary: Delete one slot (Doctors only)
 *     tags: [Doctor]
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
 *         description: Forbidden, user is not an admin or if doctor try to delete another doctor's slot
 *       404:
 *         description: If the slot not found
 *
 */
export const deleteDoctorSlot = async (req: Request, res: Response) => {
  const slotID = req.params.slotID as string;
  if (!slotID || !Types.ObjectId.isValid(slotID)) {
    throw new AppError(400, "Slot ID is required.");
  }
  const userID = req.user?.id as string;
  const findDoc = await Doctor.findOne({ userID }).lean();
  if (!findDoc) {
    throw new AppError(404, "Doctor profile not found.");
  }
  const getSlot = await DocSlot.findById(slotID).lean();
  if (!getSlot) {
    throw new AppError(404, "This slot not found ");
  }
  if (getSlot.isBooked) {
    throw new AppError(400, "Cannot delete a slot that is already booked!");
  }
  if (findDoc._id.toString() !== getSlot.doctorID.toString()) {
    throw new AppError(403, "You cannot delete another doctor's slots!");
  }
  await DocSlot.findByIdAndDelete(slotID);
  res.status(204).send();
};

/**
 * @swagger
 * /doctors/delete-many-slots:
 *   delete:
 *     summary: Delete many slots in the same time (Doctors only)
 *     tags: [Doctor]
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
 *         description: If {slotIDs} wasn't an array , if an id is invalid or if the slots are already booked and also id SlotIDs was empty
 *       401:
 *         description: Unauthenticated, token missing or invalid
 *       403:
 *         description: Forbidden, user is not a doctor
 */
export const deleteManyDoctorSlots = async (req: Request, res: Response) => {
  const { slotIDs } = req.body;
  if (!Array.isArray(slotIDs) || slotIDs.length === 0) {
    throw new AppError(400, "Please provide an array of slots IDs to delete");
  }
  const userID = req.user?.id as string;
  const findDoc = await Doctor.findOne({ userID }).exec();
  if (!findDoc) {
    throw new AppError(404, "Doctor profile not found.");
  }
  const hasInvalidId = slotIDs.some((id) => !Types.ObjectId.isValid(id));

  if (hasInvalidId)
    throw new AppError(400, "One or more provided slot IDs are invalid");

  const objectSlotIds = slotIDs.map((id: string) => new Types.ObjectId(id));
  const result = await DocSlot.deleteMany({
    _id: { $in: objectSlotIds },
    doctorID: findDoc._id,
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
    message: `${result.deletedCount} slots deleted successfully.`,
  });
};

/**
 * @swagger
 * /doctors/appointments/my-appointments:
 *   get:
 *     summary: Get all doctor's appointments with pagination and search (Doctors only)
 *     tags: [Doctor]
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
 *           example: "2026-10-10"
 *         description: Search by appointment date, patient name or patient email
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
 *                   example: "Your appointments"
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
 *         description: Forbidden, user is not a doctor
 */
export const getDoctorAppointments = async (req: Request, res: Response) => {
  const userID = req.user?.id;
  if (!userID) {
    throw new AppError(401, "you should log in first");
  }
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const search = (req.query.search as string)?.trim() || "";
  const skip = (page - 1) * limit;

  const findDoc = await Doctor.findOne({ userID }).lean();
  if (!findDoc) {
    throw new AppError(404, "Doctor Profile not found!");
  }

  let searchFilter: any = { doctorID: findDoc._id };

  if (search.length > 0) {
    const [matchingPatient, matchingDate] = await Promise.all([
      User.find({
        $or: [
          { first_name: { $regex: search, $options: "i" } },
          { last_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      })
        .select("_id")
        .lean(),
      DocSlot.find({
        doctorID: findDoc._id,
        date: { $regex: search, $options: "i" },
      })
        .select("_id")
        .lean(),
    ]);
    const userIds = matchingPatient.map((user) => user._id);
    const slotIds = matchingDate.map((date) => date._id);

    searchFilter.$or = [
      { patientID: { $in: userIds } },
      { slotID: { $in: slotIds } },
    ];
  }
  const [docAppointments, totalDocAppointments] = await Promise.all([
    Appointment.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .populate([
        {
          path: "patientID",
          select: "first_name last_name email phone avatar gender",
        },
        { path: "slotID", select: "date startTime endTime price" },
      ])
      .lean(),
    Appointment.countDocuments(searchFilter),
  ]);
  res.status(200).json({
    success: true,
    message: "Your appointments",
    results: docAppointments.length,
    total: totalDocAppointments,
    page,
    totalPages: Math.ceil(totalDocAppointments / limit),
    data: docAppointments,
  });
};

/**
 * @swagger
 * /doctors/appointments/{appointmentID}/status:
 *   patch:
 *     summary: Update the status of an appointment (Doctors only)
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentID
 *         schema:
 *           type: string
 *           example: 6aa9d8cf51da0972b69ead8a
 *         description: appointment id to get this appointment
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
 *                 example: "'confirmed' or 'rejected' or 'completed'"
 *     responses:
 *       200:
 *         description: "means that this appointment status has been changed and if it rejected then the slot will be availabel"
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
 *                   example: "The status has been changed successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: If the status wasn't confirmed or rejected or completed and if the appointment id was invalid or if this appointment was already cancelled or rejected or completed
 *       401:
 *         description:  Unauthenticated, token missing or invalid
 *       404:
 *         description: If doctor profile or appointment not found
 *       403:
 *         description: Forbidden, user is not a doctor or if this appointment wan't for this doctor
 */
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  const appointmentID = req.params.appointmentID as string;
  if (!appointmentID || !Types.ObjectId.isValid(appointmentID)) {
    throw new AppError(400, "Invalid appointment id is required");
  }
  const { status }: { status: "confirmed" | "rejected" | "completed" } =
    req.body;
  if (!["confirmed", "rejected", "completed"].includes(status)) {
    throw new AppError(400, "Add your status for this Appointment!");
  }
  const userID = req.user?.id;
  if (!userID) {
    throw new AppError(401, "You should Log in first!");
  }
  const findDoc = await Doctor.findOne({ userID }).lean();

  if (!findDoc) {
    throw new AppError(404, "Doctor Profile not found!");
  }
  const getAppointment = await Appointment.findById(appointmentID).exec();
  if (!getAppointment) {
    throw new AppError(404, "This Appointment not found!");
  }
  if (findDoc._id.toString() !== getAppointment.doctorID.toString()) {
    throw new AppError(
      403,
      "You cannot handle the Status of this Appointment.",
    );
  }
  if (getAppointment.status === status) {
    return res
      .status(200)
      .json({ message: `this appointment has already ${status}` });
  }

  if (["rejected", "completed", "cancelled"].includes(getAppointment.status)) {
    throw new AppError(
      400,
      `cannot update an appointment that is ${getAppointment.status}`,
    );
  }
  if (status === "rejected") {
    await DocSlot.findByIdAndUpdate(getAppointment.slotID, {
      isBooked: false,
    });
  }

  getAppointment.status = status;
  await getAppointment.save();

  res.status(200).json({
    success: true,
    message: "The Status has been changed successfully.",
    data: getAppointment,
  });
};

/**
 * @swagger
 * /doctors/get-profile/{doctorID}:
 *   get:
 *     summary: Get profile of the doctor
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: doctorID
 *         schema:
 *           type: string
 *           example: 6aa9d8cf51da0972b69ead8a
 *         description: doctor id to get this doctor
 *     responses:
 *       200:
 *         description: "means that this doctor is exist"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: If doctor id was invalid
 *       404:
 *         description: If doctor profile not found
 */
export const getDoctorProfile = async (req: Request, res: Response) => {
  const doctorID = req.params.doctorID as string;
  if (!doctorID || !Types.ObjectId.isValid(doctorID)) {
    throw new AppError(400, "Valid doctor id is required.");
  }
  const getProfile = await Doctor.findById(doctorID)
    .populate("userID", "first_name last_name email avatar gender")
    .lean();
  if (!getProfile) {
    throw new AppError(404, "Doctor Profile not found!");
  }
  res.status(200).json({
    success: true,
    data: getProfile,
  });
};

/**
 * @swagger
 * /doctors/update-profile/{doctorID}:
 *   patch:
 *     summary: Update profile of the doctor (Doctors only)
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorID
 *         schema:
 *           type: string
 *           example: 6aa9d8cf51da0972b69ead8a
 *         description: doctor id to get this doctor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - consultationFee
 *               - specialty
 *               - address
 *               - phone
 *               - isAcceptingAppointments
 *               - bio
 *               - email
 *               - doctorPhone
 *             properties:
 *               consultationFee:
 *                 type: number
 *                 example: 100
 *               specialty:
 *                 type: string
 *                 example: "update_specialty"
 *               address:
 *                 type: string
 *                 example: "update_address"
 *               phone:
 *                 type: string
 *                 example: "1234567890"
 *               isAcceptingAppointments:
 *                 type: boolean
 *                 example: string
 *               bio:
 *                 type: string
 *                 example: "boi_example"
 *               email:
 *                 type: string
 *                 example: "update_email"
 *               doctorPhone:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       200:
 *         description: "means that updating was successful"
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
 *                   example: "Doctor profile updated successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: if doctor id was invalid, if doctor try to update his rate or role... or if he doesn't update anything
 *       401:
 *         description:  Unauthenticated, token missing
 *       403:
 *         description: Forbidden, token is invalid, user is not a doctor or if this doctor try to update another doctor's profile
 */
export const updateDoctorProfile = async (req: Request, res: Response) => {
  const doctorID = req.params.doctorID as string;
  if (!doctorID || !Types.ObjectId.isValid(doctorID)) {
    throw new AppError(400, "Valid doctor id is required.");
  }
  const userID = req.user?.id as string;
  const findDoc = await Doctor.findOne({ userID }).exec();
  if (!findDoc) {
    throw new AppError(404, "Doctor profile not found.");
  }
  if (doctorID !== findDoc._id.toString()) {
    throw new AppError(403, "you cannot update another doctor's profile");
  }
  if (req.body.status) {
    throw new AppError(403, "Only admin can update the status of you.");
  }
  if (req.body.averageRating || req.body.numOfReviews || req.body.userID) {
    throw new AppError(
      400,
      "You can't update the rating and the number of reviews!",
    );
  }
  const allowedUpdates = [
    "specialty",
    "address",
    "consultationFee",
    "isAcceptingAppointments",
    "bio",
  ];
  const allowedUpdatesOfUser = ["email", "phone"];

  const updateData: Record<string, any> = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      updateData[key] = req.body[key];
    }
  });
  const updateDataOfUser: Record<string, string> = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedUpdatesOfUser.includes(key)) {
      updateDataOfUser[key] = req.body[key];
    }
  });
  if (req.body.doctorPhone) {
    updateData.phone = req.body.doctorPhone;
  }
  if (
    Object.keys(updateData).length === 0 &&
    Object.keys(updateDataOfUser).length === 0
  ) {
    throw new AppError(400, "No valid fields provided for update.");
  }
  await User.findOneAndUpdate(
    { _id: userID },
    { $set: updateDataOfUser },
    { new: true, runValidators: true },
  );
  const updateProfile = await Doctor.findByIdAndUpdate(
    findDoc._id,
    { $set: updateData },
    { new: true, runValidators: true },
  ).populate(
    "userID",
    "first_name last_name email phone gender isVerified verificationTokenExpiry avatar ",
  );

  res.status(200).json({
    success: true,
    message: "Doctor profile updated successfully",
    data: updateProfile,
  });
};
