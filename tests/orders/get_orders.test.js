import supertest from 'supertest'
import { web } from '../../src/application/web.js'
import { createTestAdmin, createTestUser, removeTestAdmin, removeTestUser } from '../utils/user-util.js'
import { createTestProduct, removeAllTestProducts } from '../utils/product-util.js'
import { prismaClient } from '../../src/application/database.js'
import { removeAllTestOrders } from '../utils/order-util.js'

describe('GET /api/orders', () => {
    let token = ''
    let availableProductId = 0

    beforeEach(async () => {
        await removeAllTestOrders()
        await removeAllTestProducts()
        await removeTestAdmin()
        await removeTestUser()

        await createTestUser(web)
        const loginResponse = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'rahasia123'
            })
        token = loginResponse.body.data.token

        await createTestProduct()
        const products = await prismaClient.product.findMany({
            where: {
                variant: {
                    contains: 'Test'
                }
            }
        })
        availableProductId = products.find(p => p.is_available === true).id
    })

    afterEach(async () => {
        await removeAllTestOrders()
        await removeAllTestProducts()
        await removeTestAdmin()
        await removeTestUser()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should get all orders for the current user along with the nested items and products', async () => {
        await supertest(web)
            .post('/api/orders')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                username: 'Tester Order',
                no_wa: '08123456789',
                address: 'Jalan Testing Pesanan No 1',
                orderItems: [{
                    productId: availableProductId,
                    quantity: 2,
                    spice_level: 3
                }]
            })

        const response = await supertest(web)
            .get('/api/orders')
            .set('x-api-key', `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body.data).toBeDefined()

        const orders = response.body.data
        expect(Array.isArray(orders)).toBe(true)
        expect(orders.length).toBe(1)

        const order = orders[0]
        expect(order.username).toBe('Tester Order')
        expect(order.total_price).toBe(30000)

        expect(order.orderItems).toBeDefined()
        expect(order.orderItems.length).toBe(1)

        const item = order.orderItems[0]
        expect(item.quantity).toBe(2)

        expect(item.product).toBeDefined()
        expect(item.product.variant).toBe('Seblak Test Ori')
    })

    it('should not return orders belonging to other users', async () => {
        await supertest(web)
            .post('/api/orders')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                username: 'Tester Order',
                no_wa: '08123456789',
                address: 'Jalan Pertama',
                orderItems: [{ productId: availableProductId, quantity: 1, spice_level: 1 }]
            })

        await createTestAdmin()
        const loginUserB = await supertest(web)
            .post('/api/users/login')
            .send({ email: 'admin@example.com', password: 'rahasia123' })
        const tokenUserB = loginUserB.body.data.token

        const response = await supertest(web)
            .get('/api/orders')
            .set('x-api-key', `Bearer ${tokenUserB}`)

        expect(response.status).toBe(200)
        expect(response.body.data.length).toBe(0)
    })

    it('should return an empty array if the user has not ordered anything yet', async () => {
        const response = await supertest(web)
            .get('/api/orders')
            .set('x-api-key', `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data.length).toBe(0)
    })

    it('should reject access if no authorization token is provided', async () => {
        const response = await supertest(web)
            .get('/api/orders')

        expect(response.status).toBe(401)
        expect(response.body.errors).toContain('Unauthorized: Please log in first')
    })
})