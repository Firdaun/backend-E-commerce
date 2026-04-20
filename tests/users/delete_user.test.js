import supertest from "supertest"
import { web } from "../../src/application/web"
import { createTestUser, removeTestUser } from "../utils/user-util"
import { prismaClient } from "../../src/application/database"

describe('DELETE /api/users/current', () => {
    let token = ''

    beforeEach(async () => {
        await removeTestUser()
        await createTestUser()

        const loginResponse = await supertest(web)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'rahasia123'
            })
        token = loginResponse.body.data.token
    })

    afterEach(async () => {
        await removeTestUser()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('should delete account successfully if password is correct', async () => {
        const response = await supertest(web)
            .delete('/api/users/current')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                password: 'rahasia123'
            })

        expect(response.status).toBe(200)
        expect(response.body.message).toBe('Account successfully deleted')

        const checkUser = await prismaClient.user.count({
            where: {
                email: 'test@example.com'
            }
        })
        expect(checkUser).toBe(0)
    })

    it('should reject deletion if password is wrong', async () => {
        const response = await supertest(web)
            .delete('/api/users/current')
            .set('x-api-key', `Bearer ${token}`)
            .send({
                password: 'salahpassword'
            })

        expect(response.status).toBe(400)
        expect(response.body.errors).toContain('Invalid password')
    })

    it('should reject deletion if validation fails empty password', async () => {
        const response = await supertest(web)
            .delete('/api/users/current')
            .set('x-api-key', `Bearer ${token}`)
            .send({})

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
    })

    it('should reject deletion if token is not provided', async () => {
        const response = await supertest(web)
            .delete('/api/users/current')
            .send({
                password: 'rahasia123'
            })

        expect(response.status).toBe(401)
        expect(response.body.errors).toBeDefined()
    })

    it('should delete account and wipe all related sessions and orders (Cascade Delete)', async () => {
        // Buat pesanan palsu sebelum akun dihapus
        const user = await prismaClient.user.findUnique({ where: { email: 'test@example.com' } })
        await prismaClient.order.create({
            data: {
                userId: user.id, username: 'Test Delete', no_wa: '081', address: '-', total_price: 10000, status: 'Menunggu'
            }
        })

        const response = await supertest(web)
            .delete('/api/users/current')
            .set('x-api-key', `Bearer ${token}`)
            .send({ password: 'rahasia123' })

        expect(response.status).toBe(200)

        // Pastikan User terhapus
        const checkUser = await prismaClient.user.count({ where: { email: 'test@example.com' } })
        expect(checkUser).toBe(0)

        // Pastikan tabel Order milik user ini juga benar-benar BERSIH
        const checkOrders = await prismaClient.order.count({ where: { userId: user.id } })
        expect(checkOrders).toBe(0)
    })
})