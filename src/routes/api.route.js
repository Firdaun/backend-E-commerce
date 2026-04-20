import express from 'express'
import { productController } from '../controllers/product.controller.js'
import { orderController } from '../controllers/order.controller.js'
import { userController } from '../controllers/user.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'
import { ordersLimiter, otpBlockLimiter, otpCooldownLimiter, progressiveLoginLimiter, registerLimiter } from '../middleware/rate_limiter.middleware.js'

const router = express.Router()

/**
 * =======================================================================
 * 1. PUBLIC ROUTES (Akses Terbuka)
 * =======================================================================
 * Endpoint yang bisa diakses oleh siapa saja tanpa memerlukan token JWT.
 */

// Autentikasi & Registrasi
router.post('/users/register', registerLimiter, userController.register)
router.post('/users/login', progressiveLoginLimiter, userController.login)

// Verifikasi Email
router.post('/users/verify-email', userController.verifyEmail)
router.post('/users/verify-email/resend', otpBlockLimiter, otpCooldownLimiter, userController.resendVerificationEmail)

// Lupa Password
router.post('/users/reset-password/request', otpBlockLimiter, otpCooldownLimiter, userController.requestPasswordReset)
router.post('/users/reset-password', userController.resetPassword)

// Katalog (Biasanya melihat produk tidak perlu login)
router.get('/products', productController.getProducts)


/**
 * =======================================================================
 * 2. PROTECTED ROUTES (Akses Pengguna)
 * =======================================================================
 * Endpoint yang mewajibkan pengguna untuk login (authMiddleware).
 */

// Manajemen Profil (Current User)
router.get('/users/current', authMiddleware, userController.getCurrentUser)
router.patch('/users/current', authMiddleware, userController.updateProfile)
router.delete('/users/current', authMiddleware, userController.deleteAccount)
router.delete('/users/logout', authMiddleware, userController.logout)

// Keamanan Akun
router.patch('/users/current/password', authMiddleware, userController.updatePassword)
router.patch('/users/current/email/request', authMiddleware, otpBlockLimiter, otpCooldownLimiter, userController.requestUpdateEmail)
router.patch('/users/current/email/verify', authMiddleware, userController.verifyUpdateEmail)

// Transaksi (Pesanan)
router.post('/orders', authMiddleware, ordersLimiter, orderController.createOrder)
router.get('/orders', authMiddleware, orderController.getOrders)


/**
 * =======================================================================
 * 3. ADMIN ROUTES (Akses Terbatas)
 * =======================================================================
 * Endpoint khusus untuk pengelola sistem (authMiddleware + adminMiddleware).
 */

// Manajemen Produk
router.post('/products', authMiddleware, adminMiddleware, productController.createProduct)
router.put('/products/:id', authMiddleware, adminMiddleware, productController.updateProduct)
router.delete('/products/:id', authMiddleware, adminMiddleware, productController.deleteProduct)

// Manajemen Pesanan Global
router.get('/admin/orders', authMiddleware, adminMiddleware, orderController.getAllOrders)
router.put('/admin/orders/:id/status', authMiddleware, adminMiddleware, orderController.updateOrderStatus)

export { router }