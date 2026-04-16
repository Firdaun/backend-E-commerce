import supertest from 'supertest'
import { web } from '../../src/application/web.js'
import { createTestUser, removeTestUser } from '../utils/user-util.js'
import { prismaClient } from '../../src/application/database.js'

describe('POST /api/users/login', () => {
    beforeEach(async () => {
        await removeTestUser()
    })

    afterEach(async () => {
        await removeTestUser()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should login successfully with valid credentials and return a token', async () => {
        await createTestUser()

        const response = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'rahasia123'
            })

        expect(response.status).toBe(200)
        expect(response.body.message).toBe('Login successful')
        expect(response.body.data.token).toBeDefined()
        expect(response.body.data.user.email).toBe('test@example.com')
    })

    it('should reject login with incorrect password', async () => {
        await createTestUser()

        const response = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('Incorrect email or password')
    })

    it('should reject login with empty email', async () => {
        const response = await supertest(web)
            .post('/api/users/login')
            .send({
                email: '',
                password: 'asfebjusn'
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('is not allowed to be empty')
    })
    
    it('should reject login with empty email and password', async () => {
        const response = await supertest(web)
            .post('/api/users/login')
            .send({
                email: '',
                password: ''
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('\"email\" is not allowed to be empty. \"password\" is not allowed to be empty, nu baleg bos')
    })

    it('should block the IP after 5 consecutive failed login attempts', async () => {
        await createTestUser()

        const hackerIP = '192.168.1.89'

        for (let i = 0; i < 4; i++) {
            const response = await supertest(web)
                .post('/api/users/login')
                .set('X-Forwarded-For', hackerIP)
                .send({
                    email: 'test@example.com',
                    password: 'tebakpassword'
                })
            expect(response.status).toBe(400)
        }

        const blockedResponse = await supertest(web)
            .post('/api/users/login')
            .set('X-Forwarded-For', hackerIP)
            .send({
                email: 'test@example.com',
                password: 'tebakpassword'
            })

        expect(blockedResponse.status).toBe(429)
        expect(blockedResponse.body.errors).toContain('Too many login attempts')
    })

    it('should enforce a maximum of 3 active devices', async () => {
        await createTestUser()

        for (let i = 1; i <= 4; i++) {
            await supertest(web)
                .post('/api/users/login')
                .set('User-Agent', `Device-${i}`)
                .send({
                    email: 'test@example.com',
                    password: 'rahasia123'
                })
        }

        const user = await prismaClient.user.findUnique({
            where: { email: 'test@example.com' }
        })

        const activeSessions = await prismaClient.session.findMany({
            where: { userId: user.id }
        })

        expect(activeSessions.length).toBe(3)

        const savedDeviceInfos = activeSessions.map(session => session.device_info)
        expect(savedDeviceInfos).not.toContain('Device-1')
        expect(savedDeviceInfos).toContain('Device-4')
    })
})