import supertest from "supertest"
import { web } from "../../src/application/web"
import { createTestUser, removeTestUser } from "../utils/user-util"
import { prismaClient } from "../../src/application/database"
import bcrypt from 'bcrypt'

describe('PATCH /api/users/password', () => {
    let token = ''

    beforeEach(async () => {
        await removeTestUser()
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
        await removeTestUser()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should update pasword successfully', async () => {
        const response = await supertest(web)
            .patch('/api/users/current/password')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                old_password: 'rahasia123',
                new_password: 'passwordbaru123'
            })
        
        expect(response.status).toBe(200)
        expect(response.body.message).toBe('Password successfully updated')

        const user = await prismaClient.user.findUnique({
            where: {
                email: 'test@example.com'
            }
        })
        
        const isPasswordMatch = await bcrypt.compare('passwordbaru123', user.password)
        expect(isPasswordMatch).toBe(true)
    })

    it('should reject if old password is wrong', async () => {
        const response = await supertest(web)
            .patch('/api/users/current/password')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                old_password: 'salahpassword',
                new_password: 'passwordbaru123'
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('Old password is wrong')
    })

    it('should reject if token is not provided', async () => {
        const response = await supertest(web)
            .patch('/api/users/current/password')
            .send({
                old_password: 'rahasia123',
                new_password: 'passwordbaru123'
            })

        expect(response.status).toBe(401)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject if new password is the same as old password', async () => {
        const response = await supertest(web)
            .patch('/api/users/current/password')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                old_password: 'rahasia123',
                new_password: 'rahasia123'
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('New password cannot be the same as the old password')
    })
})