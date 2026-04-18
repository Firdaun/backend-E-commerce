import { prismaClient } from '../application/database.js'
import { ResponseError } from '../error/response.error.js'
import { loginValidation, registerValidation, updateUserValidation } from '../validation/user.validation.js'
import { validate } from '../validation/validation.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

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

    return prismaClient.user.create({
        data: user,
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
        }
    })
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

    const token = jwt.sign(
        { 
            id: user.id,
            role: user.role,
            session_id: Date.now() + Math.random()
        },
        process.env.JWT_SECRET,
        {expiresIn: '1d'}
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
            email:true,
            name: true,
            no_wa: true,
            address: true,
            role: true,
            updatedAt: true
        }
    })
}

export const userService = {
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile
}