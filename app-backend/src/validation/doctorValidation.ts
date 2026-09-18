import joi from "joi";
import type { IDoctroSchema } from "../types/app.js";

export const applyAsDoctorVali = joi
  .object({
    consultationFee: joi.number().min(2).required(),
    specialty: joi.string().min(10).max(30).required(),
    address: joi.string().min(10).max(40).required(),
    phone: joi
      .string()
      .length(10)
      .required()
      .pattern(/^\d+$/)
      .message("phone number should be with numbers."),
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
    price: joi.number().required(),
    excludedSlots: joi
      .array()
      .items(joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/))
      .optional()
      .default([]),
  })
  .unknown(false);

export const updateDoctorProfileVali = joi
  .object({
    consultationFee: joi.number().min(2).optional(),
    specialty: joi.string().min(10).max(30).optional(),
    address: joi.string().min(10).max(40).optional(),
    phone: joi.string().length(10).pattern(/^\d+$/).optional(),
    isAcceptingAppointments: joi.boolean().optional(),
    bio: joi.string().min(10).max(200).optional(),
    email: joi.string().email().optional(),
    doctorPhone: joi.string().length(10).optional(),
  })
  .unknown(false);

export const deleteManyDocSlotsVali = joi
  .object({
    slotIDs: joi
      .array()
      .items(joi.string().length(24).required())
      .min(1)
      .required(),
  })
  .unknown(false);
