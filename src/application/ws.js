import { WebSocket, WebSocketServer } from "ws"

let wss

export const initWebSocket = (server) => {
    wss = new WebSocketServer({server})

    wss.on('connection', (ws) => {
        console.log('Dashboard Admin Terhubung Ke WebSocket!')
        
        wss.on('close', () => {
            console.log('Dashboard Admin Terputus Dari WebSocket')
        })
    })
} 

export const broadcastOrderToAdmin = (newOrder) => {
    if (!wss) return

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'NEW_ORDER',
                message: 'Ada Pesanan Seblak Baru Masuk!',
                data: newOrder
            }))
        }
    })
}