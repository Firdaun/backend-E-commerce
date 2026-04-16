import supertest from 'supertest'
import { web } from '../../src/application/web.js'
import { prismaClient } from '../../src/application/database.js'
import { removeAllTestProducts } from '../utils/product-util.js'
import { createTestAdmin, createTestUser, removeTestAdmin, removeTestUser } from '../utils/user-util.js'

describe('POST /api/products', () => {
    beforeEach(async () => {
        await removeAllTestProducts()
        await removeTestUser()
        await removeTestAdmin()

        await createTestUser(web)
        const loginUser = await supertest(web)
            .post('/api/users/login').send({
                email: 'test@example.com',
                password: 'rahasia123'
            })
        userToken = loginUser.body.data.token

        await createTestAdmin()
        const loginAdmin = await supertest(web).post('/api/users/login').send({
            email: 'admin@example.com',
            password: 'rahasia123'
        })
        adminToken = loginAdmin.body.data.token
    })

    afterEach(async () => {
        await removeAllTestProducts()
        await removeTestUser()
        await removeTestAdmin()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should create a new product successfully ONLY if requested by an ADMIN', async () => {
        const response = await supertest(web)
            .post('/api/products')
            .set('x-api-key', `Bearer ${adminToken}`)
            .send({
                variant: 'Seblak Test Ceker Mercon',
                price: 15000,
                spice_level: 5,
                description: 'Seblak super pedas mantap',
                image_url: 'https://example.com/seblak.jpg'
            })
        
        expect(response.status).toBe(201)
        expect(response.body.message).toBe('Seblak menu successfully added')
        expect(response.body.data.variant).toBe('Seblak Test Ceker Mercon')
    })

    it('should reject if requested by a regular User', async () => {
        const response = await supertest(web)
        .post('/api/products')
        .set('x-api-key', `Bearer ${userToken}`)
        .send({
            variant: 'Seblak Test Ilegal',
            price: 10000,
            spice_level: 1,
            image_url: 'https://example.com/seblak.jpg'
        })

        expect(response.status).toBe(403)
        expect(response.body.errors).toContain('Forbidden: Access denied. Only Admins are allowed to do this')
    })

    it('should reject if no token is provided', async () => {
        const response = await supertest(web)
            .post('/api/products')
            .send({
                variant: 'Seblak Test Tanpa Token',
                price: 10000,
                spice_level: 1
            })

        expect(response.status).toBe(401)
    })

    it('should reject if price is negative or spice_level is more than 5', async () => {
        const response = await supertest(web)
            .post('/api/products')
            .set('x-api-key', `Bearer ${adminToken}`)
            .send({
                variant: 'Seblak Test Ngawur',
                price: -5000,
                spice_level: 10,
                image_url: 'https://example.com/seblak.jpg'
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
    })
})