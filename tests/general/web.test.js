import supertest from 'supertest'
import { web } from '../../src/application/web.js'
import { prismaClient } from '../../src/application/database.js'

describe('Pengecekan API Seblak', () => {

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    it('harus bisa mengembalikan pesan sukses saat menembak rute /', async () => {

        const response = await supertest(web).get('/')

        expect(response.status).toBe(200)
        expect(response.body.message).toBe('API Seblak Hot Jeletot Terkoneksi')
    })

})