import joi from "joi";
import type { IDoctroSchema } from "../types/app.js";

export const applyAsDoctorVali = joi
  .object({
    consultationFee: joi.number().min(2).required(),
    specialty: joi.string().min(10).max(30).required(),
    address: joi.string().min(10).max(40).required(),
    phone: joi.string().length(10).required(),
  })
  .unknown(false);

export const addDoctorSlotsVali = joi
  .object({
    date: joi
      .string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required(),
    startTime: joi.string().required(),
    endTime: joi.string().required(),
    excludedSlots: joi
      .array()
      .items(joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/))
      .optional()
      .default([]),
  })
  .unknown(false);

export const updateDoctorProfileVali = joi
  .object({
    consultationFee: joi.number().min(2).required(),
    specialty: joi.string().min(10).max(30).required(),
    address: joi.string().min(10).max(40).required(),
    phone: joi.string().length(10).required(),
    isAcceptingAppointments: joi.boolean().optional(),
  })
  .unknown(false);
