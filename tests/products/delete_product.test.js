import supertest from "supertest"
import { removeAllTestOrders } from "../utils/order-util"
import { createTestProduct, removeAllTestProducts } from "../utils/product-util"
import { createTestAdmin, createTestUser, removeTestAdmin, removeTestUser } from "../utils/user-util"
import { web } from "../../src/application/web"
import { prismaClient } from "../../src/application/database"

describe('DELETE /api/products/:id', () => {
    let adminToken = ''
    let userToken = ''
    let testProductId = 0

    beforeEach(async () => {
        await removeAllTestOrders()
        await removeAllTestProducts()
        await removeTestAdmin()
        await removeTestUser()

        await createTestAdmin()
        const loginAdmin = await supertest(web)
            .post('/api/users/login')
            .set('x-api-key', `Bearer ${adminToken}`)
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
        testProductId = product.id
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

    it('should delete product successfully if requested by Admin and not linked to any order', async () => {
        const response = await supertest(web)
            .delete(`/api/products/${testProductId}`)
            .set('x-api-key', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
        expect(response.body.message).toBe('Seblak menu successfully removed from the list!')

        const checkProduct = await prismaClient.product.count({
            where: {
                id: testProductId
            }
        })
        expect(checkProduct).toBe(0)
    })

    it('should reject deletion if requested by regular User', async () => {
        const response = await supertest(web)
            .delete(`/api/products/${testProductId}`)
            .set('x-api-key', `Bearer ${userToken}`)

        expect(response.status).toBe(403)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject deletion if no token is provided', async () => {
        const response = await supertest(web)
            .delete(`/api/products/${testProductId}`)

        expect(response.status).toBe(401)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject deletion if product id is not found', async () => {
        const response = await supertest(web)
            .delete(`/api/products/999999`)
            .set('x-api-key', `Bearer ${adminToken}`)

        expect(response.status).toBe(404)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject deletion if product is already ordered', async () => {
        const user = await prismaClient.user.findUnique({
            where: {
                email: 'test@example.com'
            }
        })

        await prismaClient.order.create({
            data: {
                userId: user.id,
                username: 'Tester Order',
                no_wa: '089680447555',
                address: 'Alamat Test Delete',
                total_price: 15000,
                status: 'Menunggu',
                orderItems: {
                    create: [
                        {
                            productId: testProductId,
                            quantity: 1,
                            spice_level: 1,
                            price_at_purchase: 15000
                        }
                    ]
                }
            }
        })

        const response = await supertest(web)
            .delete(`/api/products/${testProductId}`)
            .set('x-api-key', `Bearer ${adminToken}`)

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('The product cannot be deleted because it already exists in the order history')
    })
})