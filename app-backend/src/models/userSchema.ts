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
    phone: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      default: null,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpiry: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: function (): string {
        return `https://ui-avatars.com/api/?name=${this.first_name}+${this.last_name}&background=random&color=fff&size=128`;
      },
    },
    avatarPublicID: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const User = mongoose.model<UserTypes>("User", userSchema);

export default User;
