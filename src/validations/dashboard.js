import Joi from "joi";

export const DashboardValidator = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
});

