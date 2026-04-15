import supertest from "supertest"
import { web } from "../../src/application/web.js"
import { prismaClient } from "../../src/application/database.js"
import { removeAllTestProducts } from "../utils/product-util.js"

describe('POST /api/products', () => {
    beforeEach(async () => {
        await removeAllTestProducts()
    })

    afterEach(async () => {
        await removeAllTestProducts()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should create a new product successfully with valid data', async () => {
        const response = await supertest(web)
            .post('/api/products')
            .send({
                variant: 'Seblak Test Ceker Mercon',
                price: 15000,
                spice_level: 5,
                description: 'Seblak super pedas mantap',
                image_url: 'https://example.com/seblak.jpg'
            })
        
        expect(response.status).toBe(201)
        expect(response.body.message).toBe("Menu seblak berhasil ditambahkan!")
        expect(response.body.data.variant).toBe("Seblak Test Ceker Mercon")
        expect(response.body.data.price).toBe(15000)
    })

    it('should reject if price is negative or spice_level is more than 5', async () => {
        const response = await supertest(web)
        .post('/api/products')
        .send({
            variant: "Seblak Test Ngawur",
            price: -5000,
            spice_level: 10,
            image_url: "https://example.com/seblak.jpg"
        })

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()

        const errors = response.body.errors
        expect(errors.includes('positive') || errors.includes('less than or equal to 5')).toBeTruthy()
    })

    it('should reject if the input contains malicious XSS tags', async () => {
        const response = await supertest(web)
            .post('/api/products')
            .send({
                variant: "Seblak Test <script>alert('Hack')</script>",
                price: 12000,
                spice_level: 2,
                image_url: "https://example.com/seblak.jpg"
            });

        expect(response.status).toBe(400);
        expect(response.body.errors).toContain("berbahaya");
    })
})