import supertest from 'supertest'
import { createTestProduct, removeAllTestProducts } from '../utils/product-util.js'
import { web } from '../../src/application/web.js'
import { prismaClient } from '../../src/application/database.js'
import { removeTestAdmin } from '../utils/user-util.js'
import { removeAllTestOrders } from '../utils/order-util.js'

describe('GET /api/products', () => {
    beforeEach(async () => {
        await removeAllTestOrders()
        await removeAllTestProducts()
        await removeTestAdmin()
    })

    afterEach(async () => {
        await removeAllTestOrders()
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
})