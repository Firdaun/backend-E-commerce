import supertest from 'supertest'
import { createTestProduct, removeAllTestProducts } from '../utils/product-util.js'
import { web } from '../../src/application/web.js'
import { prismaClient } from '../../src/application/database.js'
import { createTestAdmin, removeTestAdmin } from '../utils/user-util.js'

describe('GET /api/products', () => {
    beforeEach(async () => {
        await removeAllTestProducts()
        await removeTestAdmin()
    })

    afterEach(async () => {
        await removeAllTestProducts()
        await removeTestAdmin()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should return all available products and hide the unavailable ones', async () => {
        await createTestProduct()

        const response = await supertest(web)
        .get('/api/products')

        expect(response.status).toBe(200)
        expect(response.body.data).toBeDefined()

        const products = response.body.data
        expect(Array.isArray(products)).toBe(true)
        expect(products.length).toBe(1)

        expect(products[0].variant).toBe('Seblak Test Ori')
        expect(products[0].is_available).toBe(true)
    })

    it('should return an empty array if there are no available products', async () => {
        const response = await supertest(web)
        .get('/api/products')

        expect(response.status).toBe(200)
        expect(response.body.data).toBeDefined()

        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data.length).toBe(0)
    })

    it('should return all orders by admin', async () => {
        await createTestAdmin()
        const loginResponse = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'admin@example.com',
                password: 'rahasia123'
            })
        expect(loginResponse.body.data.token).toBeDefined()

        const token = loginResponse.body.data.token
        
        const response = await supertest(web)
            .get('/api/admin/orders/')
            .set('x-api-key', `Bearer ${token}`)

        const panjangArray = response.body.data

        expect(response.status).toBe(200)
        expect(Array.isArray(panjangArray)).toBe(true)
        expect(panjangArray.length).toBe(0)

        const isiArrayKeSatu = panjangArray[0]

        expect(isiArrayKeSatu.username).toBe('Irham')
        expect(isiArrayKeSatu.status).toBe('Sedang Dimasak')

    })
})