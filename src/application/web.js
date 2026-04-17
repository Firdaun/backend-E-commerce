import express from 'express'
import cors from 'cors'
import { router } from '../routes/api.route.js'
import { errorMiddleware } from '../middleware/error.middleware.js'

export const web = express()

web.set('trust proxy', 1)

web.use(cors())
web.use(express.json())

web.get('/', (_, res) => {
    res.json({ message: 'API Seblak Hot Jeletot Terkoneksi' })
})

web.use('/api', router)

web.use(errorMiddleware)