import supertest from 'supertest'
import { web } from '../../src/application/web.js'
import { prismaClient } from '../../src/application/database.js'
import { removeTestUser } from '../utils/user-util.js'
import bcrypt from 'bcrypt'

describe('POST /api/users/verify-email', () => {
    let testUserId = 0
    const validCode = '112233'

    beforeEach(async () => {
        await prismaClient.otp.deleteMany()
        await removeTestUser()

        const user = await prismaClient.user.create({
            data: {
                email: 'test@example.com',
                password: await bcrypt.hash('rahasia123', 10),
                name: 'Unverified User',
                is_verified: false
            }
        })
        testUserId = user.id

        await prismaClient.otp.create({
            data: {
                code: validCode,
                type: 'VERIFY_EMAIL',
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                userId: testUserId
            }
        })
    })

    afterEach(async () => {
        await prismaClient.otp.deleteMany()
        await removeTestUser()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should verify email successfully with valid OTP', async () => {
        const response = await supertest(web)
            .post('/api/users/verify-email')
            .send({ email: 'test@example.com', code: validCode })

        expect(response.status).toBe(200)
        expect(response.body.message).toContain('successfully verified')

        const checkUser = await prismaClient.user.findUnique({ where: { email: 'test@example.com' } })
        expect(checkUser.is_verified).toBe(true)
    })

    it('should reject if user is already verified', async () => {
        await prismaClient.user.update({
            where: { id: testUserId },
            data: { is_verified: true }
        })

        const response = await supertest(web)
            .post('/api/users/verify-email')
            .send({ email: 'test@example.com', code: validCode })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('already verified')
    })
})