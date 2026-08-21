import { string } from "joi";
import { type JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";

export type UserTypes = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "patient" | "doctor" | "admin";
  verificationToken?: string | null;
  verificationTokenExpiry?: Date | null;
  isVerified: boolean;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  avatar: string;
  avatarPublicID?: string | null;
  phone?: string | null;
  gender?: string | null;
  tokenVersion: number;
  isBlocked: boolean;
};

export interface CustomPayload extends JwtPayload {
  userInfo: {
    id: string;
    role: string;
    tokenVersion: number;
  };
}

export interface ReqUserType {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: ReqUserType;
    }
  }
}

export interface IDoctroSchema extends Document {
  userID: mongoose.Types.ObjectId;
  phone: string;
  specialty: string;
  address: string;
  consultationFee: number;
  // availableDayes: string[];

  isAcceptingAppointments: boolean;
  status: string;
  averageRating: number;
  numOfReviews: number;
}

// export interface IApplyAsDoctorInput {
//     specialty : string;
//     address : string;
//     consultationFree : number;
//     availableDayes : string[];
//     startTime ?: string;
//     endTime ?: string;
// }

export interface ISlotSchemaType extends Document {
  doctorID: mongoose.Types.ObjectId;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface IReviewSchema extends Document {
  patientID: mongoose.Types.ObjectId;
  doctorID: mongoose.Types.ObjectId;
  appointmentID: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

export interface IAppointmentSchema extends Document {
  patientID: mongoose.Types.ObjectId;
  doctorID: mongoose.Types.ObjectId;
  slotID: mongoose.Types.ObjectId;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "rejected";
  payment: boolean;
  notes: string;
}

export type OptionEmailType = {
  to: string | string[];
  subject: string;
  html: string;
};
