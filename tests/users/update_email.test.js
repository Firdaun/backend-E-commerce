import supertest from 'supertest'
import { web } from '../../src/application/web.js'
import { prismaClient } from '../../src/application/database.js'
import { createTestUser, removeTestUser } from '../utils/user-util.js'
import { sendOtpEmail } from '../../src/utils/email-util.js'
import bcrypt from 'bcrypt'

jest.mock('../../src/utils/email-util.js', () => {
    return {
        sendOtpEmail: jest.fn().mockResolvedValue(true)
    }
})

describe('Update Email Feature', () => {
    let token = ''

    beforeEach(async () => {
        await prismaClient.otp.deleteMany()
        await removeTestUser()
        await prismaClient.user.deleteMany({ where: { email: 'email_baru_berhasil@example.com' } })
        await prismaClient.user.deleteMany({ where: { email: 'other@example.com' } })
        
        await createTestUser()

        const loginResponse = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'rahasia123'
            })
        token = loginResponse.body.data.token
    })

    afterEach(async () => {
        await prismaClient.otp.deleteMany()
        await removeTestUser()
        await prismaClient.user.deleteMany({ where: { email: 'other@example.com' } })
        jest.clearAllMocks()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    describe('PATCH /api/users/current/email/request', () => {
        it('should send OTP to new email and save it with valid password', async () => {
            const response = await supertest(web)
                .patch('/api/users/current/email/request')
                .set('x-api-key', `Bearer ${token}`)
                .send({
                    new_email: 'newemail@example.com',
                    password: 'rahasia123'
                })

            expect(response.status).toBe(200)
            expect(response.body.message).toBeDefined()

            expect(sendOtpEmail).toHaveBeenCalledTimes(1)
            expect(sendOtpEmail).toHaveBeenCalledWith('newemail@example.com', expect.any(String))

            const otpInDb = await prismaClient.otp.findFirst({
                where: { type: 'UPDATE_EMAIL' }
            })
            expect(otpInDb).toBeDefined()
            expect(otpInDb.newEmail).toBe('newemail@example.com')
        })

        it('should reject if password is wrong', async () => {
            const response = await supertest(web)
                .patch('/api/users/current/email/request')
                .set('x-api-key', `Bearer ${token}`)
                .send({
                    new_email: 'newemail@example.com',
                    password: 'salahpassword'
                })

            expect(response.status).toBe(400)
            expect(response.body.errors).toContain('Invalid password')
            expect(sendOtpEmail).not.toHaveBeenCalled()
        })

        it('should reject if new email is already registered by another user', async () => {
            await prismaClient.user.create({
                data: {
                    email: 'other@example.com',
                    password: await bcrypt.hash('password123', 10),
                    name: 'Orang Lain'
                }
            })

            const response = await supertest(web)
                .patch('/api/users/current/email/request')
                .set('x-api-key', `Bearer ${token}`)
                .send({
                    new_email: 'other@example.com',
                    password: 'rahasia123'
                })

            expect(response.status).toBe(400)
            expect(response.body.errors).toContain('already in use')
            expect(sendOtpEmail).not.toHaveBeenCalled()
        })
    })

    describe('PATCH /api/users/current/email/verify', () => {
        let validOtpCode = '654321'

        beforeEach(async () => {
            const user = await prismaClient.user.findUnique({ where: { email: 'test@example.com' } })
            await prismaClient.otp.create({
                data: {
                    code: validOtpCode,
                    type: 'UPDATE_EMAIL',
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                    userId: user.id,
                    newEmail: 'email_baru_berhasil@example.com'
                }
            })
        })

        it('should update email successfully with valid OTP', async () => {
            const response = await supertest(web)
                .patch('/api/users/current/email/verify')
                .set('x-api-key', `Bearer ${token}`)
                .send({
                    code: validOtpCode
                })

            expect(response.status).toBe(200)
            expect(response.body.data.email).toBe('email_baru_berhasil@example.com')

            const checkUser = await prismaClient.user.findUnique({
                where: { email: 'email_baru_berhasil@example.com' }
            })
            expect(checkUser).toBeDefined()

            const otpCount = await prismaClient.otp.count()
            expect(otpCount).toBe(0)
        })

        it('should reject if OTP is invalid', async () => {
            const response = await supertest(web)
                .patch('/api/users/current/email/verify')
                .set('x-api-key', `Bearer ${token}`)
                .send({
                    code: '000000'
                })

            expect(response.status).toBe(400)
            expect(response.body.errors).toContain('Invalid OTP')
        })
    })
})