import express from 'express'
import { router as userRouter } from './user.route.js'
import { router as productRouter } from './product.route.js'
import { router as cartRouter } from './cart.route.js'
import { router as orderRouter } from './order.route.js'

// Menggabungkan semua sub-routes ke router utama
const router = express.Router()

router.use(userRouter)
router.use(productRouter)
router.use(cartRouter)
router.use(orderRouter)

export { router }