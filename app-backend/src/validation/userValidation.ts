import joi from "joi";
export const updateUserVali = joi.object({
  first_name: joi.string().min(2).max(15).optional(),
  last_name: joi.string().min(2).max(15).optional(),
  email: joi.string().email().optional(),
  phone: joi.string().length(10).optional(),
  gender: joi.string().optional(),
});

export const changePasswordVali = joi.object({
    oldPassword : joi.string().min(8).max(30).required(),
    newPassword : joi.string().min(8).max(30).required(),
    confirmNewPass : joi.string().min(8).max(30).required(),
})