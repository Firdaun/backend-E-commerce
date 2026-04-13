import Joi from "joi";

const createProductValidation = Joi.object({
    variant: Joi.string().max(100).required(),
    price: Joi.number().min(1).positive().required(),
    spice_level: Joi.number().min(0).max(5).required(), // Maksimal level 5 sesuai UI
    description: Joi.string().optional().allow(""),
    image_url: Joi.string().uri().required(), // Harus berupa link yang valid
    is_available: Joi.boolean().optional()
});

export {
    createProductValidation
};