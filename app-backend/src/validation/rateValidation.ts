import joi from "joi";

export const rateValidation = joi.object({
  rate: joi.number().min(0).max(5).default(0),
  comment: joi.string().min(4).max(120).required(),
});
