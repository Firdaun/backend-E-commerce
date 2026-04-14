import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response.error.js"
import { loginValidation, registerValidation } from "../validation/user.validation.js"
import { validate } from "../validation/validation.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const register = async (request) => {
    const user = validate(registerValidation, request)

    const countUser = await prismaClient.user.count({
        where: {
            email: user.email
        }
    })

    if (countUser === 1) {
        throw new ResponseError(400, "Email sudah terdaftar")
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

const login = async (request) => {
    const loginReq = validate(loginValidation, request)

    const user = await prismaClient.user.findUnique({
        where: {
            email: loginReq.email
        }
    })

    if (!user) {
        throw new ResponseError(400, "Email atau password salah")
    }

    const isPasswordValid = await bcrypt.compare(loginReq.password, user.password)

    if (!isPasswordValid) {
        throw new ResponseError(400, "Email atau password salah")
    }

    const token = jwt.sign(
        { 
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {expiresIn: "1d"}
    )

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

export const userService = {
    register,
    login
}