import { Joi } from './customjoi.validation.js'

const addToCartValidation = Joi.object({
    productId: Joi.number().positive().required(),
    quantity: Joi.number().min(1).max(50).required(),
    spice_level: Joi.number().min(0).max(5).required()
})

const updateCartItemValidation = Joi.object({
    quantity: Joi.number().min(1).max(50).optional(),
    spice_level: Joi.number().min(0).max(5).optional()
})

export {
    addToCartValidation,
    updateCartItemValidation
}