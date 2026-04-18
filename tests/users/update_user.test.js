import supertest from "supertest"
import { createTestUser, removeTestUser } from "../utils/user-util"
import { web } from "../../src/application/web"
import { prismaClient } from "../../src/application/database"

describe('PATCH /api/users/current', () => {
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

    it('should update user profile successfully', async () => {
        const response = await supertest(web)
            .patch('/api/users/current')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                name: 'Fahrul Updated',
                no_wa: '085943251649',
                address: 'Alamat baru'
            })

        expect(response.status).toBe(200)
        expect(response.body.data.name).toBe('Fahrul Updated')
        expect(response.body.data.no_wa).toBe('085943251649')
        expect(response.body.data.address).toBe('Alamat baru')

        const userInDb = await prismaClient.user.findUnique({
            where: {
                email: 'test@example.com'
            }
        })
        expect(userInDb.name).toBe('Fahrul Updated')
    })

    it('should update only specific field partial update', async () => {
        const response = await supertest(web)
            .patch('/api/users/current')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                name: 'Only Name Updated'
            })

        expect(response.status).toBe(200)
        expect(response.body.data.name).toBe('Only Name Updated')
        expect(response.body.data.email).toBe('test@example.com')
    })

    it('should reject update if validation fails', async () => {
        const response = await supertest(web)
            .patch('/api/users/current')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                name: ''
            })
        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
    })
})