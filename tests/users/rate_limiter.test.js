import supertest from "supertest"
import { prismaClient } from "../../src/application/database"
import { web } from "../../src/application/web"
import { removeTestUser } from "../utils/user-util"
import bcrypt from 'bcrypt'

jest.mock('../../src/utils/email-util.js', () => {
    return {
        sendOtpEmail: jest.fn().mockResolvedValue(true)
    }
})

describe('Rate Limiter Security Tests', () => {
    let originalEnv

    beforeAll(() => {
        originalEnv = process.env.NODE_ENV

        process.env.NODE_ENV = 'development'
    })

    afterAll(async () => {
        process.env.NODE_ENV = originalEnv
        await prismaClient.$disconnect()
    })

    beforeEach(async () => {
        await prismaClient.otp.deleteMany()
        await prismaClient.user.deleteMany({
            where: {
                email: {
                    contains: 'limiter'
                }
            }
        })
        await removeTestUser()
    })

    afterEach(async () => {
        await prismaClient.otp.deleteMany()
        await prismaClient.user.deleteMany({
            where: {
                email: {
                    contains: 'limiter'
                }
            }
        })
        await removeTestUser()
        jest.clearAllMocks
    })

    describe('Register Limiter', () => {
        it('should block IP after 3 consecutive registration attempts', async () => {
            const testIp = '123.45.67.89'

            let response = await supertest(web)
                .post('/api/users/register')
                .set('X-Forwarded-For', testIp)
                .send({ email: 'limiter1@example.com', password: 'password123', name: 'User 1' })
            expect(response.status).toBe(201)

            response = await supertest(web)
                .post('/api/users/register')
                .set('X-Forwarded-For', testIp)
                .send({ email: 'limiter2@example.com', password: 'password123', name: 'User 2' })
            expect(response.status).toBe(201)

            response = await supertest(web)
                .post('/api/users/register')
                .set('X-Forwarded-For', testIp)
                .send({ email: 'limiter3@example.com', password: 'password123', name: 'User 3' })
            expect(response.status).toBe(201)

            response = await supertest(web)
                .post('/api/users/register')
                .set('X-Forwarded-For', testIp)
                .send({ email: 'limiter4@example.com', password: 'password123', name: 'User 4' })
            
            expect(response.status).toBe(429)
            expect(response.body.errors).toContain('There are too many account creation')
        })
    })
    describe('OTP Cooldown Limiter (Lapis 1)', () => {
        it('should block consecutive OTP requests within 60 seconds', async () => {
            const testIp = '98.76.54.32'

            await prismaClient.user.create({
                data: {
                    email: 'limiter_otp@example.com',
                    password: await bcrypt.hash('password123', 10),
                    name: 'Limiter OTP',
                    is_verified: true
                }
            })

            let response = await supertest(web)
                .post('/api/users/reset-password/request')
                .set('X-Forwarded-For', testIp)
                .send({ email: 'limiter_otp@example.com' })
            
            expect(response.status).toBe(200)

            response = await supertest(web)
                .post('/api/users/reset-password/request')
                .set('X-Forwarded-For', testIp)
                .send({ email: 'limiter_otp@example.com' })
            
            expect(response.status).toBe(429)
            expect(response.body.errors).toContain('Please wait 60 seconds')
        })
    })
})