import supertest from "supertest"
import { createTestProduct, removeAllTestProducts } from "../utils/product-util.js"
import { createTestAdmin, createTestUser, removeTestAdmin, removeTestUser } from "../utils/user-util.js"
import { web } from "../../src/application/web.js"
import { prismaClient } from "../../src/application/database.js"
import { removeAllTestOrders } from "../utils/order-util.js"

describe('PUT /api/admin/orders/:id/status', () => {
    let adminToken = ''
    let userToken = ''
    let testOrderId = 0

    beforeEach(async () => {
        await removeAllTestOrders()
        await removeAllTestProducts()
        await removeTestUser()
        await removeTestAdmin()

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
            where: {
                variant: 'Seblak Test Ori'
            }
        })

        const userId = await prismaClient.user.findUnique({
            where: {
                email: 'test@example.com'
            }
        })

        const order = await prismaClient.order.create({
            data: {
                userId: userId.id,
                username: 'Tester Order',
                no_wa: '08123456789',
                address: 'Jalan Testing',
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
        testOrderId = order.id
    })

    afterEach(async () => {
        await removeAllTestOrders()
        await removeAllTestProducts()
        await removeTestUser()
        await removeTestAdmin()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should update order status successfully if requested by Admin', async () => {
        const response = await supertest(web)
            .put(`/api/admin/orders/${testOrderId}/status`)
            .set('x-api-key', `Bearer ${adminToken}`)
            .send({
                status: 'Sedang Dimasak'
            })

        expect(response.status).toBe(200)
        expect(response.body.data.status).toBe('Sedang Dimasak')

        const checkOrder = await prismaClient.order.findUnique({
            where: {
                id: testOrderId
            }
        })
        expect(checkOrder.status).toBe('Sedang Dimasak')
    })

    it('should reject if requested by a regular User', async () => {
        const response = await supertest(web)
            .put(`/api/admin/orders/${testOrderId}/status`)
            .set('x-api-key', `Bearer ${userToken}`)
            .send({
                status: 'Sedang Dimasak'
            })

            expect(response.status).toBe(403)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject if status is invalid', async () => {
        const response = await supertest(web)
            .put(`/api/admin/orders/${testOrderId}/status`)
            .set('x-api-key', `Bearer ${adminToken}`)
            .send({
                status: 'Status Tidak Valid'
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject if order id is not found', async () => {
        const response = await supertest(web)
            .put('/api/admin/orders/999999/status')
            .set('x-api-key', `Bearer ${adminToken}`)
            .send({
                status: 'Sedang Dimasak'
            })

        expect(response.status).toBe(404)
        expect(response.body.errors).toBeDefined()
    })
})