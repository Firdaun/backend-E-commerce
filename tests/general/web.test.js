import supertest from 'supertest'
import { web } from '../../src/application/web.js'

describe('Pengecekan API Seblak', () => {

    it('harus bisa mengembalikan pesan sukses saat menembak rute /', async () => {

        const response = await supertest(web).get('/')

        expect(response.status).toBe(200)
        expect(response.body.message).toBe('API Seblak Hot Jeletot Terkoneksi')
    })

})