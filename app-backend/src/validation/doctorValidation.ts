import joi from "joi";
import type { IDoctroSchema } from "../types/app.js";



export const applyAsDoctorVali  = joi.object({
    consultationFree : joi.number().min(2).required(),
    availableDayes : joi.array().items(joi.string()).min(2).required(),
    startTime : joi.string().default("90:00"),
    endTime : joi.string().default("17:00"),
    specialty : joi.string().min(10).max(30).required(),
    address : joi.string().min(10).max(40).required(),
    phone : joi.string().length(10).required(),
})