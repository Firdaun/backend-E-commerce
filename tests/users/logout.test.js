import supertest from 'supertest'
import { prismaClient } from '../../src/application/database.js'
import { web } from '../../src/application/web.js'
import { createTestUser, removeTestUser } from '../utils/user-util.js'

describe('DELETE /api/users/logout', () => {
    beforeEach(async () => {
        await removeTestUser()
    })

    afterEach(async () => {
        await removeTestUser()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should logout successfully and physically delete the session from the database', async () => {
        await createTestUser()
        const loginResponse = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'rahasia123'
            })

        const token = loginResponse.body.data.token

        const response = await supertest(web)
            .delete('/api/users/logout')
            .set('x-api-key', `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body.data).toBe('Logout successful')

        const sessionInDb = await prismaClient.session.findUnique({
            where: {
                token: token
            }
        })
        expect(sessionInDb).toBeNull()
    })

    it('should reject logout if no authorization token is provided', async () => {
        const response = await supertest(web)
            .delete('/api/users/logout')

        expect(response.status).toBe(401)
        expect(response.body.errors).toContain('Unauthorized: Please log in first')
    })

    it('should reject logout if the token is invalid or already logged out', async () => {
        await createTestUser()
        const loginResponse = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'rahasia123'
            })

        const token = loginResponse.body.data.token

        await supertest(web)
            .delete('/api/users/logout')
            .set('x-api-key', `Bearer ${token}`)

        const response = await supertest(web)
            .delete('/api/users/logout')
            .set('x-api-key', `Bearer ${token}`)

        expect(response.status).toBe(401)
        expect(response.body.errors).toContain('The session has expired')
    })
})