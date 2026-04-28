import express from 'express'
import { cartController } from '../controllers/cart.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

// Keranjang Belanja (Cart)
router.get('/carts', authMiddleware, cartController.getCart)
router.post('/carts', authMiddleware, cartController.addToCart)
router.patch('/carts/:itemId', authMiddleware, cartController.updateCartItem)
router.delete('/carts/:itemId', authMiddleware, cartController.removeCartItem)

export { router }
