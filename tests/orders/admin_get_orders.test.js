import supertest from 'supertest'
import { web } from '../../src/application/web.js'
import { prismaClient } from '../../src/application/database.js'
import { createTestAdmin, removeTestAdmin, createTestUser, removeTestUser } from '../utils/user-util.js'
import { createTestProduct, removeAllTestProducts } from '../utils/product-util.js'
import { removeAllTestOrders } from '../utils/order-util.js'

describe('GET /api/admin/orders', () => {
    let adminToken = ''
    let userToken = ''

    beforeEach(async () => {
        await removeAllTestOrders()
        await removeAllTestProducts()
        await removeTestAdmin()
        await removeTestUser()

        await createTestAdmin()
        const loginAdmin = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'admin@example.com',
                password: 'rahasia123'
            })
        adminToken = loginAdmin.body.data.token

        await createTestUser()
        const loginUser = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'rahasia123'
            })
        userToken = loginUser.body.data.token

        await createTestProduct()
        const product = await prismaClient.product.findFirst({
            where: { variant: 'Seblak Test Ori' }
        })

        const adminUser = await prismaClient.user.findUnique({
            where: { email: 'admin@example.com' }
        })

        await prismaClient.order.create({
            data: {
                userId: adminUser.id,
                username: 'Tester Order',
                no_wa: '08123456789',
                address: 'Jalan Testing Admin',
                total_price: product.price,
                status: 'Menunggu',
                orderItems: {
                    create: [
                        {
                            productId: product.id,
                            quantity: 1,
                            spice_level: 2,
                            price_at_purchase: product.price
                        }
                    ]
                }
            }
        })
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

    it('should return all orders if requested by Admin', async () => {
        const response = await supertest(web)
            .get('/api/admin/orders')
            .set('x-api-key', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data.length).toBe(1)

        const firstOrder = response.body.data[0]
        expect(firstOrder.username).toBe('Tester Order')
        expect(firstOrder.status).toBe('Menunggu')
        expect(firstOrder.user.email).toBe('admin@example.com')
    })

    it('should reject access if requested by regular User', async () => {
        const response = await supertest(web)
            .get('/api/admin/orders')
            .set('x-api-key', `Bearer ${userToken}`)

        expect(response.status).toBe(403)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject access if no token is provided', async () => {
        const response = await supertest(web)
            .get('/api/admin/orders')

        expect(response.status).toBe(401)
        expect(response.body.errors).toBeDefined()
    })
})