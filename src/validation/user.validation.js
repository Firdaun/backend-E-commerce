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

const updatePasswordValidation = Joi.object({
    old_password: Joi.string().required(),
    new_password: Joi.string().min(6).required()
})

const deleteAccountValidation = Joi.object({
    password: Joi.string().required()
})

const requestResetPaswordValidation = Joi.object({
    email: Joi.string().email().required()
})

const resetPasswordValidation = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(6).required(),
    new_password: Joi.string().min(6).required()
})

const verifyEmailValidation = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(6).required()
})

const resendVerificationValidation = Joi.object({
    email: Joi.string().email().required()
})

export {
    registerValidation,
    loginValidation,
    updateUserValidation,
    updatePasswordValidation,
    deleteAccountValidation,
    requestResetPaswordValidation,
    resetPasswordValidation,
    verifyEmailValidation,
    resendVerificationValidation
}