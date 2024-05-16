import Joi from "joi";

export const VoucherValidator = Joi.object({
    Name: Joi.string().required(),
    Quantity: Joi.number().required().min(0),
    reduced_amount: Joi.number().required().min(1000).max(10000000),
    price_order: Joi.number().required().min(0),
    description: Joi.string().required().min(6).max(255),
    expiration_date: Joi.date().required(),
    start_date: Joi.date()
        .when('expiration_date', {
            is: Joi.exist(),
            then: Joi.date().max(Joi.ref('expiration_date')).required(),
            otherwise: Joi.date()
        })
});

