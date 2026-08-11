import mongoose from "mongoose";
import type { UserTypes } from "../types/app.js";

const userSchema = new mongoose.Schema<UserTypes>(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
  },
  { timestamps: true },
);

const User = mongoose.model<UserTypes>("User", userSchema);

export default User;
