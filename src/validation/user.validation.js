import { Joi } from './customjoi.validation.js'

const registerValidation = Joi.object({
    email: Joi.string().email().max(100).required().antiXSS(),
    password: Joi.string().min(6).max(100).required(),
    name: Joi.string().max(100).required().antiXSS()
})

const loginValidation = Joi.object({
    email: Joi.string().email().max(100).required().antiXSS(),
    password: Joi.string().min(6).max(100).required()
})

const updateUserValidation = Joi.object({
    name: Joi.string().max(100).optional().antiXSS(),
    no_wa: Joi.string().max(20).optional().allow(null, '').antiXSS(),
    address: Joi.string().optional().allow(null, '').antiXSS()
})

export {
    registerValidation,
    loginValidation,
    updateUserValidation
}