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
  consultationFree: number;
  availableDayes: string[];
  startTime: string;
  endTime: string;
  isAcceptingAppointments: boolean;
  status: string;
}

// export interface IApplyAsDoctorInput {
//     specialty : string;
//     address : string;
//     consultationFree : number;
//     availableDayes : string[];
//     startTime ?: string;
//     endTime ?: string;
// }
