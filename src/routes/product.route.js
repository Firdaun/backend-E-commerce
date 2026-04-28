import express from 'express'
import { productController } from '../controllers/product.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'

const router = express.Router()

// Katalog Produk (Public)
router.get('/products', productController.getProducts)
router.get('/products/:id', productController.getProductById)

// Manajemen Produk (Admin)
router.post('/products', authMiddleware, adminMiddleware, productController.createProduct)
router.put('/products/:id', authMiddleware, adminMiddleware, productController.updateProduct)
router.delete('/products/:id', authMiddleware, adminMiddleware, productController.deleteProduct)

export { router }
