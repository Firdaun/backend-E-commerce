import supertest from "supertest"
import { prismaClient } from "../../src/application/database.js"
import { createTestUser, removeTestUser } from "../utils/user-util.js"
import { web } from "../../src/application/web.js"

describe('GET /api/user/current', () => {
    beforeEach(async () => {
        await removeTestUser()

    })
    
    afterEach(async () => {
        await removeTestUser()
    })
    
    afterAll(async () => {
        await prismaClient.$disconnect()
    })
    
    it('should get current user successfully', async () => {
        await createTestUser()
    
        const loginResponse = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'rahasia123'
            })
    
        const tokenUser = loginResponse.body.data.token

        const response = await supertest(web)
            .get('/api/users/current')
            .set('x-api-key', `Bearer ${tokenUser}`)
        

        expect(response.status).toBe(200)
        expect(response.body.data.email).toBe('test@example.com')
        expect(response.body.data.name).toBe('Fahrul Tester')
        expect(response.body.data.password).toBeUndefined()
    })

    it('should reject if no token is provided', async () => {
        const response = await supertest(web)
            .get('/api/users/current')

        expect(response.status).toBe(401)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject if token is invalid', async () => {
        const response = await supertest(web)
            .get('/api/users/current')
            .set('x-api-key', `Bearer invalidtoken123`)

        expect(response.status).toBe(401)
        expect(response.body.errors).toBeDefined()
    })
})