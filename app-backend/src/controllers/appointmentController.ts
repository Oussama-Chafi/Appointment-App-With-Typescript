import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import DocSlot from "../models/slotSchema.js";
import Appointment from "../models/appointmentSchema.js";

export const bookAppointment = async (req : Request , res : Response) => {

    const slotID = req.params.slotID as string;
    const patientID = req.user?.id;
    if(!slotID){
        throw new AppError(400 , "Thre is no ID for this Slot!")
    }
    if(!patientID){
        throw new AppError(400 , "This Account does not exist or is Unauthenticated!")
    }
    const getSlot = await DocSlot.findById(slotID)
    if(!getSlot){
        throw new AppError(404, "Sorry! this no slot with this ID")
    }
    if(getSlot.isBooked){
        throw new AppError(400 , "This Appointment is not Available. Please choose another Slot.")
    }

    const doctorID = getSlot.doctorID
    const createAppointment = await Appointment.create({
        patientID,
        doctorID,
        slotID,
    })
    getSlot.isBooked = true;
    await getSlot.save();

    res.status(201).json({
        success : true,
        message : "Appointment created successsfully",
        data : createAppointment
    })
}