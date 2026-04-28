import express from 'express'
import { orderController } from '../controllers/order.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'
import { ordersLimiter } from '../middleware/rate_limiter.middleware.js'

const router = express.Router()

// Transaksi Pesanan (User)
router.post('/orders', authMiddleware, ordersLimiter, orderController.createOrder)
router.get('/orders', authMiddleware, orderController.getOrders)

// Manajemen Pesanan Global (Admin)
router.get('/admin/orders', authMiddleware, adminMiddleware, orderController.getAllOrders)
router.put('/admin/orders/:id/status', authMiddleware, adminMiddleware, orderController.updateOrderStatus)

export { router }
