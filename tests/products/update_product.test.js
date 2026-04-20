import supertest from "supertest"
import { createTestAdmin, createTestUser, removeTestAdmin, removeTestUser } from "../utils/user-util"
import { web } from "../../src/application/web"
import { createTestProduct, removeAllTestProducts } from "../utils/product-util"
import { prismaClient } from "../../src/application/database"
import { removeAllTestOrders } from "../utils/order-util"

describe('PUT /api/products/:id', () => {
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

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should update product successfully if requested by Admin', async () => {
        const response = await supertest(web)
            .put(`/api/products/${testProductId}`)
            .set('x-api-key', `Bearer ${adminToken}`)
            .send({
                price: 20000,
                is_available: false
            })

        expect(response.status).toBe(200)
        expect(response.body.data.price).toBe(20000)
        expect(response.body.data.is_available).toBe(false)

        const checkProduct = await prismaClient.product.findUnique({
            where: {
                id: testProductId
            }
        })
        expect(checkProduct.price).toBe(20000)
        expect(checkProduct.is_available).toBe(false)
    })

    it('should reject access if requested by regular User', async () => {
        const response = await supertest(web)
            .put(`/api/products/${testProductId}`)
            .set('x-api-key', `Bearer ${userToken}`)
            .send({
                price: 20000
            })
        
        expect(response.status).toBe(403)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject access if no token is provided', async () => {
        const response = await supertest(web)
            .put(`/api/products/${testProductId}`)
            .send({
                price: 20000
            })

        expect(response.status).toBe(401)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject update if product id is not found', async () => {
        const response = await supertest(web)
            .put(`/api/products/999999`)
            .set('x-api-key', `Bearer ${adminToken}`)
            .send({
                price: 20000
            })

        expect(response.status).toBe(404)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject update if validation fails', async () => {
        const response = await supertest(web)
            .put(`/api/products/${testProductId}`)
            .set('x-api-key', `Bearer ${adminToken}`)
            .send({
                price: -10000
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
    })
})