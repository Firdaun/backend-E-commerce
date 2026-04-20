import { WebSocket, WebSocketServer } from 'ws'

let wss

export const initWebSocket = (server) => {
    wss = new WebSocketServer({server})

    wss.on('connection', (ws) => {
        console.log('Admin Dashboard Connected To WebSocket')
        
        ws.on('close', () => {
            console.log('Admin Dashboard Disconnected From WebSocket')
        })
    })
} 

export const broadcastOrderToAdmin = (newOrder) => {
    if (!wss) return

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'NEW_ORDER',
                message: 'There is a new Seblak order coming in',
                data: newOrder
            }))
        }
    })
}