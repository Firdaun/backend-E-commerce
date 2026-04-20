import http from 'http'
import { WebSocket } from 'ws'
import { broadcastOrderToAdmin, initWebSocket } from '../../src/application/ws.js'

describe('WebSocket Broadcast Logic', () => {
    let server
    let wsClient
    let port

    beforeAll((done) => {
        server = http.createServer()
        initWebSocket(server)
        server.listen(0, () => {
            port = server.address().port
            done()
        })
    })

    // afterAll dikembalikan ke bentuk paling sederhana
    afterAll((done) => {
        if (server) server.close(done)
        else done()
    })

    it('should broadcast new order to connected admin clients', (done) => {
        wsClient = new WebSocket(`ws://localhost:${port}`)

        wsClient.on('open', () => {
            const dummyOrder = {
                id: 99,
                username: 'Tester WebSocket',
                total_price: 15000
            }
            broadcastOrderToAdmin(dummyOrder)
        })

        wsClient.once('message', (message) => {
            const parseData = JSON.parse(message.toString())

            expect(parseData.type).toBe('NEW_ORDER')
            expect(parseData.message).toBe('There is a new Seblak order coming in')
            expect(parseData.data.id).toBe(99)
            expect(parseData.data.username).toBe('Tester WebSocket')
            
            done() // Akhiri tes pertama
        })
    })

    // Ubah menjadi async/await agar bisa disuruh "menunggu"
    it('should not throw any error if broadcast is called but no clients are connected', async () => {
        
        // Jika client masih tersambung dari tes sebelumnya, putuskan dengan aman
        if (wsClient && wsClient.readyState === WebSocket.OPEN) {
            // 1. Buat janji (Promise) untuk menunggu sampai event 'close' benar-benar terjadi
            const waitForClose = new Promise(resolve => wsClient.once('close', resolve))
            
            wsClient.close() 
            await waitForClose // 2. Tunggu di sini sampai client terputus
            
            // 3. Beri waktu jeda 50 milidetik agar server sempat mencetak console.log
            await new Promise(resolve => setTimeout(resolve, 50))
        }

        // Setelah dipastikan benar-benar terputus, jalankan tes utama
        expect(() => {
            broadcastOrderToAdmin({
                id: 100,
                variant: 'Seblak Hantu'
            })
        }).not.toThrow()
    })
})