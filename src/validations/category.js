import Joi from "joi";

export const categorySchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    imageUrl: Joi.object(),
    status: Joi.string().valid("active", "inactive").default("active"),
    viewCount: Joi.number().default(0),
    products:Joi.array().default([]),
});

export default categorySchema;