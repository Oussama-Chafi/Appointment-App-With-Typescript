import { string } from "joi";
import { type JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";

export type UserTypes = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string;
};

export interface CustomPayload extends JwtPayload {
  userInfo: {
    id: string;
    role: string;
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
