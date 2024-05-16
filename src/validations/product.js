import Joi from "joi";

const productValidator = Joi.object({
  product_id: Joi.string().required(),
  SKU: Joi.string(),
  name: Joi.string().required().min(6).max(50),
  description: Joi.string().required().min(6).max(500),
  categoryId: Joi.string().allow(null).optional().required(),
  price: Joi.number().min(0).required(),
  sale: Joi.string().allow(null, "").optional(),
  discount: Joi.number(),
  sold_count: Joi.number().default(0),
  rating: Joi.number(),
  sizes: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().min(0).required(),
    })
  ),
  color: Joi.string().valid("red", "green", "blue", "yellow", "black", "white").required(),
  material: Joi.string().required(),
  release_date: Joi.date(),
  images: Joi.array().items(Joi.string()),
  video: Joi.string(),
  blog: Joi.string().allow(null).optional(),
  warranty: Joi.string(),
  tech_specs: Joi.string().required().min(6).max(100),
  stock_status: Joi.string().required(),
  gender: Joi.string().required(),
  isPublished: Joi.boolean().default(false),
  publishedDate: Joi.date(),
  hits: Joi.number().default(0),
  isDeleted: Joi.boolean().default(false),
  priceSale: Joi.number().allow(null)
});

export default productValidator;