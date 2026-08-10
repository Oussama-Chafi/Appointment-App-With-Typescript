import mongoose from "mongoose";

type UserTypes = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string;
};

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
