import { Joi } from "./customjoi.validation.js"

const createOrderValidation = Joi.object({
    username: Joi.string().max(100).required().antiXSS(),
    no_wa: Joi.string().max(20).required().antiXSS(),
    address: Joi.string().required().antiXSS(),
    orderItems: Joi.array().items(
        Joi.object({
            productId: Joi.number().positive().required(),
            quantity: Joi.number().min(1).max(50).required(),
            spice_level: Joi.number().min(0).max(5).required()
        })
    ).min(1).required()
});

export {
    createOrderValidation
};