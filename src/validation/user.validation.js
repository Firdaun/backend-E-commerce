import { Joi } from "./customjoi.validation.js"

const registerValidation = Joi.object({
    email: Joi.string().email().max(100).required().antiXSS(),
    password: Joi.string().min(6).max(100).required(),
    name: Joi.string().max(100).required().antiXSS()
})

const loginValidation = Joi.object({
    email: Joi.string().email().max(100).required().antiXSS(),
    password: Joi.string().min(6).max(100).required()
})

export {
    registerValidation,
    loginValidation
}