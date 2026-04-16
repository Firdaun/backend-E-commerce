import http from "http"
import { WebSocket } from "ws"
import { broadcastOrderToAdmin, initWebSocket } from "../../src/application/ws.js"

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

    afterAll((done) => {
        if (wsClient) wsClient.close()
        if (server) server.close(done)
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
            expect(parseData.message).toBe('Ada Pesanan Seblak Baru Masuk!')
            
            expect(parseData.data.id).toBe(99)
            expect(parseData.data.username).toBe('Tester WebSocket')
            expect(parseData.data.total_price).toBe(15000)

            done()
        })
    })

    it('should not throw any error if broadcast is called but no clients are connected', () => {
        wsClient.close()

        expect(() => {
            broadcastOrderToAdmin({
                id: 100,
                variant: "Seblak Hantu"
            })
        }).not.toThrow()
    })
})