import { web } from './application/web.js'
import dotenv from 'dotenv'
import { initWebSocket } from './application/ws.js'

dotenv.config()

const PORT = process.env.PORT || 8000

const server = web.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

initWebSocket(server)