import supertest from "supertest"
import { removeAllTestCarts } from "../utils/cart-util"
import { createTestProduct, removeAllTestProducts } from "../utils/product-util"
import { createTestUser, removeTestUser } from "../utils/user-util"
import { web } from "../../src/application/web"
import { prismaClient } from "../../src/application/database"

describe('Cart Feature Test', () => {
    let token = ''
    let availableProductId = 0

    beforeEach(async () => {
        await removeAllTestCarts()
        await removeAllTestProducts()
        await removeTestUser()

        await createTestUser()
        const loginResponse = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'rahasia123'
            })
        token = loginResponse.body.data.token

        await createTestProduct()
        const product = await prismaClient.product.findFirst({
            where: {
                variant: 'Seblak Test Ori'
            }
        })
        availableProductId = product.id
    })

    afterEach(async () => {
        await removeAllTestCarts()
        await removeAllTestProducts()
        await removeTestUser()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    describe('POST /api/carts', () => {
        it('should add item to cart and create a new cart if not exists', async () => {
            const response = await supertest(web)
                .post('/api/carts')
                .set('x-api-key', `Bearer ${token}`)
                .send({
                    productId: availableProductId,
                    quantity: 2,
                    spice_level: 3
                })

            expect(response.status).toBe(200)
            expect(response.body.message).toBeDefined()
            expect(response.body.data.productId).toBe(availableProductId)
            expect(response.body.data.quantity).toBe(2)
        })

        it('should accumulate quantity if adding the same product with the same spice level', async () => {
            await supertest(web)
                .post('/api/carts')
                .set('x-api-key', `Bearer ${token}`)
                .send({
                    productId: availableProductId,
                    quantity: 2,
                    spice_level: 1
                })

            const response = await supertest(web)
                .post('/api/carts')
                .set('x-api-key', `Bearer ${token}`)
                .send({
                    productId: availableProductId,
                    quantity: 1,
                    spice_level: 1
                })

            expect(response.status).toBe(200)
            expect(response.body.data.quantity).toBe(3)
        })
    })
    describe('GET /api/carts', () => {
        it('should return cart with estimated total', async () => {
            await supertest(web)
                .post('/api/carts')
                .set('x-api-key', `Bearer ${token}`)
                .send({ productId: availableProductId, quantity: 2, spice_level: 3 })

            const response = await supertest(web)
                .get('/api/carts')
                .set('x-api-key', `Bearer ${token}`)

            expect(response.status).toBe(200)
            expect(response.body.data.cartItems.length).toBe(1)
            expect(response.body.data.estimated_total).toBeGreaterThan(0)
        })
    })

    describe('PATCH /api/carts/:itemId', () => {
        it('should update cart item quantity', async () => {
            const addResponse = await supertest(web)
                .post('/api/carts')
                .set('x-api-key', `Bearer ${token}`)
                .send({ productId: availableProductId, quantity: 1, spice_level: 1 })

            const itemId = addResponse.body.data.id

            const response = await supertest(web)
                .patch(`/api/carts/${itemId}`)
                .set('x-api-key', `Bearer ${token}`)
                .send({ quantity: 5 })

            expect(response.status).toBe(200)
            expect(response.body.data.quantity).toBe(5)
        })
    })

    describe('DELETE /api/carts/:itemId', () => {
        it('should remove item from cart', async () => {
            const addResponse = await supertest(web)
                .post('/api/carts')
                .set('x-api-key', `Bearer ${token}`)
                .send({ productId: availableProductId, quantity: 1, spice_level: 1 })

            const itemId = addResponse.body.data.id

            const response = await supertest(web)
                .delete(`/api/carts/${itemId}`)
                .set('x-api-key', `Bearer ${token}`)

            expect(response.status).toBe(200)
            expect(response.body.message).toContain('removed')
        })
    })
})