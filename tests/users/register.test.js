import { createTestUser, removeHackerUser, removeTestUser } from '../utils/user-util.js'
import supertest from 'supertest'
import { web } from '../../src/application/web.js'
import { prismaClient } from '../../src/application/database.js'

jest.mock('../../src/utils/email-util.js', () => {
    return {
        sendOtpEmail: jest.fn().mockResolvedValue(true)
    }
})

describe('POST /api/users/register', () => {
    beforeEach(async () => {
        await prismaClient.otp.deleteMany()
        await removeTestUser()
        await removeHackerUser()
    })
    afterEach(async () => {
        await prismaClient.otp.deleteMany()
        await removeTestUser()
        await removeHackerUser()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should register a new user successfully with valid data', async () => {
        const response = await supertest(web)
            .post('/api/users/register')
            .send({
                email: 'test@example.com',
                password: 'rahasia123',
                name: 'Fahrul Tester'
            })

            expect(response.status).toBe(201)
            expect(response.body.message).toBe('User has been successfully registered')

            expect(response.body.data.email).toBe('test@example.com')
            expect(response.body.data.name).toBe('Fahrul Tester')

            expect(response.body.data.password).toBeUndefined()
    })

    it('should reject registration if the email is already registered', async () => {
        await createTestUser()

        const response = await supertest(web)
        .post('/api/users/register')
        .send({
            email: 'test@example.com',
            password: 'newpassword123',
            name: 'Orang Lain'
        })

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()

        expect(response.body.errors).toContain('Email has been registered')
    })

    it('should reject registration if the input contains malicious XSS tags', async () => {
        const response = await supertest(web)
            .post('/api/users/register')
            .send({
                email: 'hacker@example.com',
                password: 'rahasia123',
                name: 'Hacker <script>alert("xss")</script>'
            })

        expect(response.status).toBe(201)
        expect(response.body.data.name).toContain('Hacker')
    })
    
    it('should reject registration if email format is invalid', async () => {
        const response = await supertest(web)
            .post('/api/users/register')
            .send({
                email: 'bukanformatemail',
                password: 'rahasia123',
                name: 'Fahrul Tester'
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('must be a valid email')
    })

    it('should reject registration if password is less than 6 characters', async () => {
        const response = await supertest(web)
            .post('/api/users/register')
            .send({
                email: 'test2@example.com',
                password: '123',
                name: 'Fahrul Tester'
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('password')
    })
})