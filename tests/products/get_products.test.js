import supertest from 'supertest'
import { createTestProduct, removeAllTestProducts } from '../utils/product-util.js'
import { web } from '../../src/application/web.js'
import { prismaClient } from '../../src/application/database.js'
import { createTestAdmin, removeTestAdmin } from '../utils/user-util.js'
import { removeAllTestOrders } from '../utils/order-util.js'

describe('GET /api/products', () => {
    beforeEach(async () => {
        await removeAllTestProducts()
        await removeAllTestOrders()
        await removeTestAdmin()
    })

    afterEach(async () => {
        await removeAllTestProducts()
        await removeAllTestOrders()
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

        const idUser = loginResponse.body.data.user.id
        
        await createTestProduct()
        const product = await prismaClient.product.findFirst({
            where: { variant: 'Seblak Test Ori' }
        })

        await prismaClient.order.create({
            data: {
                userId: idUser,
                username: 'Tester Order', 
                no_wa: '08123456789',
                address: 'Jalan Testing',
                total_price: product.price,
                status: 'Sedang Dimasak',
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

        const response = await supertest(web)
            .get('/api/admin/orders/')
            .set('x-api-key', `Bearer ${token}`)

        const panjangArray = response.body.data

        expect(response.status).toBe(200)
        expect(Array.isArray(panjangArray)).toBe(true)
        expect(panjangArray.length).toBe(1)

        const isiArrayKeSatu = panjangArray[0]

        expect(isiArrayKeSatu.username).toBe('Tester Order')
        expect(isiArrayKeSatu.status).toBe('Sedang Dimasak')

    })
})