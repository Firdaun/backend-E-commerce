import supertest from 'supertest'
import { createTestUser, removeTestUser } from '../utils/user-util.js'
import { web } from '../../src/application/web.js'
import { createTestProduct, removeAllTestProducts } from '../utils/product-util.js'
import { prismaClient } from '../../src/application/database.js'
import { removeAllTestOrders } from '../utils/order-util.js'

describe('POST /api/orders', () => {
    let token = ''
    let availableProductId = 0
    let unavailableProductId = 0

    beforeEach(async () => {
        await removeAllTestOrders()
        await removeTestUser()
        await removeAllTestProducts()

        await createTestUser()
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
        unavailableProductId = products.find(p => p.is_available === false).id
    })

    afterEach(async () => {
        await removeAllTestOrders()
        await removeTestUser()
        await removeAllTestProducts()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should create an order succesfully and calculate correct total price', async () => {
        const response = await supertest(web)
            .post('/api/orders')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                username: 'Tester Order',
                no_wa: '08123456789',
                address: 'Jalan Testing Pesanan No 1',
                orderItems: [
                    {
                        productId: availableProductId,
                        quantity: 2,
                        spice_level: 3
                    }
                ]
            })

        expect(response.status).toBe(201)
        expect(response.body.message).toBe('Order successfully created! Processing soon')

        expect(response.body.data.total_price).toBe(30000)
        expect(response.body.data.status).toBe('Menunggu')
    })

    it('should reject order if no auth token is provided', async () => {
        const response = await supertest(web)
            .post('/api/orders')
            .send({
                username: 'Tester Order',
                no_wa: '08123456789',
                address: 'Jalan Testing',
                orderItems: [{
                    productId: availableProductId,
                    quantity: 1,
                    spice_level: 1
                }]
            })

        expect(response.status).toBe(401)
        expect(response.body.errors).toContain('Unauthorized: Please log in first')
    })
    
    it('should reject order if orderItems is empty', async () => {
        const response = await supertest(web)
            .post('/api/orders')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                username: 'Tester Order',
                no_wa: '08123456789',
                address: 'Jalan Testing',
                orderItems: []
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('\"orderItems\" must contain at least 1 items')
    })

    it('should reject order if ordering an unavailable or non-existent product', async () => {
        const response = await supertest(web)
            .post('/api/orders')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                username: 'Tester Order',
                no_wa: '08123456789',
                address: 'Jalan Testing',
                orderItems: [{
                    productId: unavailableProductId,
                    quantity: 1,
                    spice_level: 1
                }]
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('Some of the ordered menus were not found or were out of stock')
    })

    it('should reject order if input contains malicious XSS tags', async () => {
        const response = await supertest(web)
            .post('/api/orders')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                username: 'Tester Order',
                no_wa: '08123456789',
                address: "<script>alert('Hack')</script> Alamat Palsu",
                orderItems: [{
                    productId: availableProductId,
                    quantity: 1,
                    spice_level: 1
                }]
            })

        expect(response.status).toBe(201)
        expect(response.body.data.address).toContain('Alamat Palsu')
    })

    it('should block spam orders using ordersLimiter', async () => {
        const spammerIP = '10.0.0.99'

        for (let i = 0; i < 10; i++) {
            await supertest(web)
                .post('/api/orders')
                .set('x-api-key', `Bearer ${token}`)
                .set('X-Forwarded-For', spammerIP)
                .send({
                    username: 'Tester Order',
                    no_wa: '08123456789',
                    address: `Jalan Testing Spam ${i}`,
                    orderItems: [{
                        productId: availableProductId,
                        quantity: 1,
                        spice_level: 1
                    }]
                })
        }

        const blockedResponse = await supertest(web)
            .post('/api/orders')
            .set('x-api-key', `Bearer ${token}`)
            .set('X-Forwarded-For', spammerIP)
            .send({
                username: 'Tester Order',
                no_wa: '08123456789',
                address: 'Jalan Testing Jebol',
                orderItems: [{
                    productId: availableProductId,
                    quantity: 1,
                    spice_level: 1
                }]
            })

        expect(blockedResponse.status).toBe(429)
        expect(blockedResponse.body.errors).toContain('Please be patient! The kitchen is cooking your order. Please allow 3 minutes for another order')
    })

    it('should reject order if quantity is less than 1 or more than 50', async () => {
        const response = await supertest(web)
            .post('/api/orders')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                username: 'Tester Order',
                no_wa: '08123456789',
                address: 'Jalan Testing',
                orderItems: [{
                    productId: availableProductId,
                    quantity: 100,
                    spice_level: 1
                }]
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('quantity')
    })

    it('should reject order if user injects unknown fields (like price manipulation)', async () => {
        const response = await supertest(web)
            .post('/api/orders')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                username: 'Tester Order',
                no_wa: '08123456789',
                address: 'Jalan Testing',
                orderItems: [{
                    productId: availableProductId,
                    quantity: 1,
                    spice_level: 1,
                    price: 1000
                }]
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('is not allowed')
    })
})