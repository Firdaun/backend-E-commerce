import supertest from 'supertest'
import { web } from '../../src/application/web.js'
import { prismaClient } from '../../src/application/database.js'
import { createTestUser, removeTestUser } from '../utils/user-util.js'
import { sendOtpEmail } from '../../src/utils/email-util.js'

jest.mock('../../src/utils/email-util.js', () => {
    return {
        sendOtpEmail: jest.fn().mockResolvedValue(true)
    }
})

describe('POST /api/users/verify-email/resend', () => {
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

    it('should resend OTP successfully if user is not verified', async () => {
        await prismaClient.user.update({
            where: { email: 'test@example.com' },
            data: { is_verified: false }
        })

        const response = await supertest(web)
            .post('/api/users/verify-email/resend')
            .send({
                email: 'test@example.com'
            })

        expect(response.status).toBe(200)
        expect(response.body.message).toBeDefined()

        expect(sendOtpEmail).toHaveBeenCalledTimes(1)
        expect(sendOtpEmail).toHaveBeenCalledWith('test@example.com', expect.any(String))

        const otpInDb = await prismaClient.otp.findFirst({
            where: {
                user: { email: 'test@example.com' },
                type: 'VERIFY_EMAIL'
            }
        })
        expect(otpInDb).toBeDefined()
        expect(otpInDb.code.length).toBe(6)
    })

    it('should reject if user is already verified', async () => {
        const response = await supertest(web)
            .post('/api/users/verify-email/resend')
            .send({
                email: 'test@example.com'
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('already verified')
        expect(sendOtpEmail).not.toHaveBeenCalled()
    })

    it('should reject if user is not found', async () => {
        const response = await supertest(web)
            .post('/api/users/verify-email/resend')
            .send({
                email: 'tidakada@example.com'
            })

        expect(response.status).toBe(404)
        expect(response.body.errors).toContain('User not found')
        expect(sendOtpEmail).not.toHaveBeenCalled()
    })

    it('should reject if validation fails (empty email)', async () => {
        const response = await supertest(web)
            .post('/api/users/verify-email/resend')
            .send({})

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
        expect(sendOtpEmail).not.toHaveBeenCalled()
    })
})