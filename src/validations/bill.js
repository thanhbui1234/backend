import joi from "joi";

export const billValidator = joi.object({
  userId: joi.string().required(),
  shoeId: joi.string().required(),
  createdAt: joi.date().default(() => new Date()),
  payment_method: joi.string().required(),
  totalPrice: joi.number().min(0).required(),
  quantity: joi.number().min(0).required(),
  image: joi.string().default(null),
  date_buy: joi.date(),
  address: joi.string().min(5).required(),
  color: joi.string(),
});
