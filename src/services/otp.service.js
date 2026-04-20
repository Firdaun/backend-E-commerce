import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response.error.js"
import { sendOtpEmail } from "../utils/email-util.js"

const generateOtp = async (userId, type, newEmail = null) => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    await prismaClient.otp.deleteMany({
        where: {
            userId: userId,
            type: type
        }
    })

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    const otp = await prismaClient.otp.create({
        data: {
            code: otpCode,
            type: type,
            expiresAt: expiresAt,
            userId: userId,
            newEmail: newEmail
        },
        select: {
            expiresAt: true
        }
    })

    let targetEmail = newEmail
    if (!targetEmail) {
        const user = await prismaClient.user.findUnique({
            where: {
                id: userId
            },
            select: {
                email: true
            }
        })
        targetEmail = user.email
    }

    await sendOtpEmail(targetEmail, otpCode)

    return otp
}

const verifyOtp = async (userId, code, type) => {
    const otp = await prismaClient.otp.findFirst({
        where: {
            userId: userId,
            code: code,
            type: type
        },
        select: {
            id: true,
            expiresAt: true,
            newEmail: true
        }
    })

    if (!otp) {
        throw new ResponseError(400, 'Invalid OTP code')
    }

    if (new Date() > otp.expiresAt) {
        await prismaClient.otp.delete({
            where: {
                id: otp.id
            }
        })
        throw new ResponseError(400, 'OTP code has expired')
    }

    await prismaClient.otp.deleteMany({
        where: {
            userId: userId,
            type: type
        }
    })

    return otp
}

export const otpService = {
    generateOtp,
    verifyOtp
}