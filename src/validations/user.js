import Joi from "joi";

export const signUpValidator = Joi.object({
  userName: Joi.string().required().min(6).max(255),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(6).max(255),
  confirmPassword: Joi.string().required().valid(Joi.ref("password")),
});

export const signInValidator = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required().min(6).max(255),
});
export const updateValidator = Joi.object({
  deliveryAddress: Joi.string(),
  userName: Joi.string().min(6).max(255),
  gender: Joi.string().valid("male", "female", "other"),
  dateOfBirth: Joi.date().iso(),
  avt: Joi.alternatives().try(
    Joi.object(), // Cho phép là một đối tượng
    Joi.string()   // Cho phép là một chuỗi
  ),
  phoneNumbers: Joi.string().min(9).max(11),
});

export const createValidator = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required().min(6).max(255),
  userName: Joi.string().required().min(6).max(255),
  role: Joi.string(),
  deliveryAddress: Joi.string().required(),
  gender: Joi.string().required().valid("male", "female", "other"),
  dateOfBirth: Joi.date().required().iso(),
  avt: Joi.object(),
  phoneNumbers: Joi.string().min(9).max(11).required(),
});
