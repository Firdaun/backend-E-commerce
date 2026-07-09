import { web } from './application/web.js'
import dotenv from 'dotenv'
import { initWebSocket } from './application/ws.js'
import { initScheduler } from './application/scheduler.js'

dotenv.config()

const PORT = process.env.PORT || 8000

const server = web.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`)
})

initWebSocket(server)
initScheduler()