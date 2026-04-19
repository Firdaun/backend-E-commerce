import supertest from 'supertest'
import bcrypt from 'bcrypt'
import { web } from '../../src/application/web.js'
import { prismaClient } from '../../src/application/database.js'
import { createTestUser, removeTestUser } from '../utils/user-util.js'
import { sendOtpEmail } from '../../src/utils/email-util.js'

jest.mock('../../src/utils/email-util.js',() => {
    return {
        sendOtpEmail: jest.fn().mockResolvedValue(true)
    }
})

describe('Reset Password Feature', () => {
    beforeEach(async () => {
        await prismaClient.otp.deleteMany()
        await removeTestUser()
        await createTestUser()
    })

    afterEach(async () => {
        await prismaClient.otp.deleteMany()
        await removeTestUser()
        jest.clearAllMocks()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    describe('POST /api/users/reset-password/request', () => {
        it('should send OTP and save it to database if email is valid', async () => {
            const response = await supertest(web)
                .post('/api/users/reset-password/request')
                .send({
                    email: 'test@example.com'
                })
            
            expect(response.status).toBe(200)
            expect(response.body.message).toBeDefined()

            expect(sendOtpEmail).toHaveBeenCalledTimes(1)
            expect(sendOtpEmail).toHaveBeenCalledWith('test@example.com', expect.any(String))

            const otpInDb = await prismaClient.otp.findFirst({
                where: {
                    user: {
                        email: 'test@example.com'
                    },
                    type: 'RESET_PASSWORD'
                }
            })
            expect(otpInDb).toBeDefined()
            expect(otpInDb.code.length).toBe(6)
        })

        it('should reject if email is not registered', async () => {
            const response = await supertest(web)
                .post('/api/users/reset-password/request')
                .send({
                    email: 'salah@example.com'
                })

            expect(response.status).toBe(404)
            expect(response.body.errors).toBeDefined()
            expect(sendOtpEmail).not.toHaveBeenCalled()
        })
    })

    describe('POST /api/users/reset-password', () => {
        let validOtpCode = '123456'

        beforeEach(async () => {
            const user = await prismaClient.user.findUnique({ where: { email: 'test@example.com' } })
            await prismaClient.otp.create({
                data: {
                    code: validOtpCode,
                    type: 'RESET_PASSWORD',
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                    userId: user.id
                }
            })
        })

        it('should reset password successfully with valid OTP', async () => {
            const response = await supertest(web)
                .post('/api/users/reset-password')
                .send({
                    email: 'test@example.com',
                    code: validOtpCode,
                    new_password: 'passwordbaru123'
                })

            expect(response.status).toBe(200)

            const updatedUser = await prismaClient.user.findUnique({ where: { email: 'test@example.com' } })
            const isMatch = await bcrypt.compare('passwordbaru123', updatedUser.password)
            expect(isMatch).toBe(true)

            const otpCount = await prismaClient.otp.count()
            expect(otpCount).toBe(0)
        })

        it('should reject if OTP code is wrong', async () => {
            const response = await supertest(web)
                .post('/api/users/reset-password')
                .send({
                    email: 'test@example.com',
                    code: '000000',
                    new_password: 'passwordbaru123'
                })

            expect(response.status).toBe(400)
            expect(response.body.errors).toContain('Invalid OTP')
        })

        it('should reject if OTP is expired', async () => {
            const user = await prismaClient.user.findUnique({ where: { email: 'test@example.com' } })
            await prismaClient.otp.updateMany({
                where: { userId: user.id },
                data: { expiresAt: new Date(Date.now() - 1000) }
            })

            const response = await supertest(web)
                .post('/api/users/reset-password')
                .send({
                    email: 'test@example.com',
                    code: validOtpCode,
                    new_password: 'passwordbaru123'
                })

            expect(response.status).toBe(400)
            expect(response.body.errors).toContain('expired')
        })
    })
})