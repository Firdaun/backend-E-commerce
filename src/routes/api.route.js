import express from 'express'
import { productController } from '../controllers/product.controller.js'
import { orderController } from '../controllers/order.controller.js'
import { userController } from '../controllers/user.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { ordersLimiter, progressiveLoginLimiter } from '../middleware/rate_limiter.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'

const router = express.Router()

router.get('/products', productController.getProducts)
router.post('/products', authMiddleware, adminMiddleware, productController.createProduct)
router.put('/products/:id', authMiddleware, adminMiddleware, productController.updateProduct)
router.delete('/products/:id', authMiddleware, adminMiddleware, productController.deleteProduct)

router.post('/users/register', userController.register)
router.post('/users/login', progressiveLoginLimiter, userController.login)
router.delete('/users/logout', authMiddleware, userController.logout)
router.get('/users/current', authMiddleware, userController.getCurrentUser)
router.patch('/users/current', authMiddleware, userController.updateProfile)
router.patch('/users/current/password', authMiddleware, userController.updatePassword)
router.delete('/users/current', authMiddleware, userController.deleteAccount)

router.post('/orders', authMiddleware, ordersLimiter, orderController.createOrder)
router.get('/orders', authMiddleware, orderController.getOrders)
router.get('/admin/orders', authMiddleware, adminMiddleware, orderController.getAllOrders)
router.put('/admin/orders/:id/status', authMiddleware, adminMiddleware, orderController.updateOrderStatus)

export { router }