import { prismaClient } from '../application/database.js'
import { ResponseError } from '../error/response.error.js'
import { deleteAccountValidation, loginValidation, registerValidation, requestResetPaswordValidation, requestUpdateEmailValidation, resendVerificationValidation, resetPasswordValidation, updatePasswordValidation, updateUserValidation, verifyEmailValidation, verifyUpdateEmailValidation } from '../validation/user.validation.js'
import { validate } from '../validation/validation.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { otpService } from './otp.service.js'

const register = async (request) => {
    const user = validate(registerValidation, request)

    const countUser = await prismaClient.user.count({
        where: {
            email: user.email
        }
    })

    if (countUser === 1) {
        throw new ResponseError(400, 'Email has been registered')
    }

    user.password = await bcrypt.hash(user.password, 10)

    const newUser = await prismaClient.user.create({
        data: user,
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
        }
    })

    await otpService.generateOtp(newUser.id, 'VERIFY_EMAIL')
    
    return newUser
}

const login = async (request, ipAddress, deviceInfo) => {
    const loginReq = validate(loginValidation, request)

    const user = await prismaClient.user.findUnique({
        where: {
            email: loginReq.email
        }
    })

    if (!user) {
        throw new ResponseError(400, 'Incorrect email or password')
    }

    const isPasswordValid = await bcrypt.compare(loginReq.password, user.password)

    if (!isPasswordValid) {
        throw new ResponseError(400, 'Incorrect email or password')
    }

    if (!user.is_verified) {
        await prismaClient.session.deleteMany({
            where: {
                userId: user.id
            }
        })
        throw new ResponseError(401, 'Please verify your email first to login')
    }

    const token = jwt.sign(
        {
            id: user.id,
            role: user.role,
            session_id: Date.now() + Math.random()
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    )

    await prismaClient.session.create({
        data: {
            token: token,
            userId: user.id,
            ip_address: ipAddress,
            device_info: deviceInfo
        }
    })

    const activeSessions = await prismaClient.session.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
    })

    if (activeSessions.length > 3) {
        const oldestSession = activeSessions[0]

        await prismaClient.session.delete({
            where: { id: oldestSession.id }
        })
    }

    return {
        token: token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }
    }
}

const logout = async (token) => {
    const session = await prismaClient.session.findUnique({
        where: {
            token: token
        }
    })

    if (!session) {
        throw new ResponseError(400, 'Session not found')
    }

    await prismaClient.session.delete({
        where: {
            token: token
        }
    })

    return 'Logout successful'
}

const getCurrentUser = async (userId) => {
    const user = await prismaClient.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            no_wa: true,
            address: true,
            createdAt: true
        }
    })

    if (!user) {
        throw new ResponseError(404, 'User not found')
    }

    return user
}

const updateProfile = async (userId, request) => {
    const updateReq = validate(updateUserValidation, request)

    const userExist = await prismaClient.user.count({
        where: {
            id: userId
        }
    })

    if (userExist === 0) {
        throw new ResponseError(404, 'User not found')
    }

    return prismaClient.user.update({
        where: {
            id: userId
        },
        data: updateReq,
        select: {
            id: true,
            email: true,
            name: true,
            no_wa: true,
            address: true,
            role: true,
            updatedAt: true
        }
    })
}

const updatePassword = async (userId, request) => {
    const updateReq = validate(updatePasswordValidation, request)

    if (updateReq.old_password === updateReq.new_password) {
        throw new ResponseError(400, 'New password cannot be the same as the old password')
    }

    const user = await prismaClient.user.findUnique({
        where: {
            id: userId
        }
    })

    if (!user) {
        throw new ResponseError(404, 'User not found')
    }

    const isPasswordValid = await bcrypt.compare(updateReq.old_password, user.password)

    if (!isPasswordValid) {
        throw new ResponseError(400, 'Old password is wrong')
    }

    const newPasswordHashed = await bcrypt.hash(updateReq.new_password, 10)

    return prismaClient.user.update({
        where: {
            id: userId
        },
        data: {
            password: newPasswordHashed
        }
    })
}

const deleteAccount = async (userId, request) => {
    const req = validate(deleteAccountValidation, request)

    const user = await prismaClient.user.findUnique({
        where: {
            id: userId
        }
    })

    if (!user) {
        throw new ResponseError(404, 'User not found')
    }

    const isPasswordValid = await bcrypt.compare(req.password, user.password)
    
    if (!isPasswordValid) {
        throw new ResponseError(400, 'Invalid password')
    }

    await prismaClient.$transaction(async (prisma) => {
        await prisma.session.deleteMany({
            where: {
                userId: userId
            }
        })

        const userOrders = await prisma.order.findMany({
            where: {
                userId: userId
            },

            select: {
                id: true
            }
        })

        const orderIds = userOrders.map(order => order.id)

        if (orderIds.length > 0) {
            await prisma.orderItem.deleteMany({
                where: {
                    orderId: {
                        in: orderIds
                    }
                }
            })

            await prisma.order.deleteMany({
                where: {
                    userId: userId
                }
            })
        }

        await prisma.user.delete({
            where: {
                id: userId
            }
        })
    })
}

const requestPasswordReset = async (request) => {
    const req = validate(requestResetPaswordValidation, request)

    const user = await prismaClient.user.findUnique({
        where: {
            email: req.email
        }
    })

    if (!user) {
        throw new ResponseError(404, 'User not found')
    }

    await otpService.generateOtp(user.id, 'RESET_PASSWORD')
}

const resetPassword = async (request) => {
    const req = validate(resetPasswordValidation, request)

    const user = await prismaClient.user.findUnique({
        where: {
            email: req.email
        }
    })

    if(!user) {
        throw new ResponseError(404, 'User not found')
    }

    await otpService.verifyOtp(user.id, req.code, 'RESET_PASSWORD')

    const newPasswordHashed = await bcrypt.hash(req.new_password, 10)

    await prismaClient.$transaction(async (prisma) => {
        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: newPasswordHashed
            }
        })

        await prisma.session.deleteMany({
            where: {
                userId: user.id
            }
        })
    })
}

const verifyEmail = async (request) => {
    const req = validate(verifyEmailValidation, request)

    const user = await prismaClient.user.findUnique({
        where: {
            email: req.email
        }
    })

    if (!user) {
        throw new ResponseError(404, 'User not found')
    }

    if (user.is_verified) {
        throw new ResponseError(400, 'User is already verified')
    }

    await otpService.verifyOtp(user.id, req.code, 'VERIFY_EMAIL')

    return prismaClient.user.update({
        where: {
            id: user.id
        },
        data: {
            is_verified: true
        },
        select: {
            email: true,
            is_verified: true
        }
    })
}

const resendVerificationEmail = async (request) => {
    const req = validate(resendVerificationValidation, request)

    const user = await prismaClient.user.findUnique({
        where:{
            email: req.email
        }
    })

    if (!user) {
        throw new ResponseError(404, 'User not found')
    }

    if (user.is_verified) {
        throw new ResponseError(400, 'User is already verified')
    }

    await otpService.generateOtp(user.id, 'VERIFY_EMAIL')
}

const requestUpdateEmail = async (userId, request) => {
    const req = validate(requestUpdateEmailValidation, request)

    const user = await prismaClient.user.findUnique({
        where: {
            id: userId
        }
    })

    const isPasswordValid = await bcrypt.compare(req.password, user.password)
    if (!isPasswordValid) {
        throw new ResponseError(400, 'Invalid password')
    }

    const emailExist = await prismaClient.user.count({
        where: {
            email: req.new_email
        }
    })

    if (emailExist > 0) {
        throw new ResponseError(400, 'Email is already in use')
    }

    await otpService.generateOtp(userId, 'UPDATE_EMAIL', req.new_email)
}

const verifyUpdateEmail = async (userId, request) => {
    const req = validate(verifyUpdateEmailValidation, request)

    const otp = await otpService.verifyOtp(userId, req.code, 'UPDATE_EMAIL')

    return prismaClient.user.update({
        where: {
            id: userId
        },
        data: {
            email: otp.newEmail
        },
        select: {
            id: true,
            email: true,
            name: true
        }
    })
}

export const userService = {
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    updatePassword,
    deleteAccount,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    requestUpdateEmail,
    verifyUpdateEmail
}