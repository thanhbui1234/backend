import Joi from "joi";
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const cartItemSchema = Joi.object({
  product: Joi.string().pattern(objectIdPattern).required(),
  size: Joi.string().required(),
  price: Joi.number().optional(),
  images: Joi.array().optional(),
});

const cartSchema = Joi.object({
  cartItems: Joi.array().items(cartItemSchema),
  user: Joi.string().optional(),
  totalPrice: Joi.number().default(0),
});

const validateCart = (cart) => cartSchema.validate(cart);
const validateCartItems = (cartItems) => cartItemSchema.validate(cartItems);
export { validateCart, validateCartItems };
