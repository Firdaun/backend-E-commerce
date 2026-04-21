import { Joi } from './customjoi.validation.js'

const createProductValidation = Joi.object({
    variant: Joi.string().max(100).required().antiXSS(),
    price: Joi.number().min(1).positive().required(),
    spice_level: Joi.number().min(0).max(5).required(),
    description: Joi.string().optional().allow('').antiXSS(),
    image_url: Joi.string().uri().required().antiXSS(),
    is_available: Joi.boolean().optional()
})

const updateProductValidation = Joi.object({
    variant: Joi.string().max(100).optional(),
    price: Joi.number().min(0).optional(),
    spice_level: Joi.number().min(0).max(5).optional(),
    description: Joi.string().optional(),
    image_url: Joi.string().uri().optional(),
    is_available: Joi.boolean().optional()
})

const getProductByIdValidation = Joi.number().min(1).positive().required()

export {
    createProductValidation,
    updateProductValidation,
    getProductByIdValidation
}