import joi from "joi";

export const registerValidation = joi.object({
  first_name: joi.string().min(2).max(15).required(),
  last_name: joi.string().min(2).max(15).required(),
  email: joi.string().email().required(),
  password: joi.string().min(8).max(30).required(),
  role: joi.string().default("patient"),
  phone: joi.string().length(10).optional().default(null),
  gender: joi.string().optional().default(null),
});

export const loginValidation = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(2).max(15).required(),
});
