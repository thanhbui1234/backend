import Joi from "joi";

export const SaleValidator = Joi.object({
    name: Joi.string().required(),
    discount: Joi.number().required().min(0).max(100),
    description: Joi.string().required().min(6).max(255),
    expiration_date: Joi.date().required(),
    product: Joi.array(),
    start_date: Joi.date()
        .when('expiration_date', {
            is: Joi.exist(),
            then: Joi.date().max(Joi.ref('expiration_date')).required(),
            otherwise: Joi.date()
        })
});
