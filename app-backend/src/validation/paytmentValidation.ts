import joi from "joi";

export const checkoutSessionVali = joi.object({
  appointmentID: joi.string().required(),
  doctorName: joi.string().required(),
  price: joi.number().min(2).required(),
});
