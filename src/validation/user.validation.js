import Joi from "joi"

const registerValidation = Joi.object({
    email: Joi.string().email().max(100).required(),
    password: Joi.string().min(6).max(100).required(),
    name: Joi.string().max(100).required()
})

const loginValidation = Joi.object({
    email: Joi.string().email().max(100).required(),
    password: Joi.string().min(6).max(100).required()
})

export {
    registerValidation,
    loginValidation
}