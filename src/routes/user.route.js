import express from 'express'
import { userController } from '../controllers/user.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { otpBlockLimiter, otpCooldownLimiter, progressiveLoginLimiter, registerLimiter } from '../middleware/rate_limiter.middleware.js'

const router = express.Router()

// Autentikasi & Registrasi
router.post('/users/register', registerLimiter, userController.register)
router.post('/users/login', progressiveLoginLimiter, userController.login)

// Verifikasi Email
router.post('/users/verify-email', userController.verifyEmail)
router.post('/users/verify-email/resend', otpBlockLimiter, otpCooldownLimiter, userController.resendVerificationEmail)

// Lupa Password
router.post('/users/reset-password/request', otpBlockLimiter, otpCooldownLimiter, userController.requestPasswordReset)
router.post('/users/reset-password', userController.resetPassword)

// Manajemen Profil (Current User)
router.get('/users/current', authMiddleware, userController.getCurrentUser)
router.patch('/users/current', authMiddleware, userController.updateProfile)
router.delete('/users/current', authMiddleware, userController.deleteAccount)
router.delete('/users/logout', authMiddleware, userController.logout)

// Keamanan Akun
router.patch('/users/current/password', authMiddleware, userController.updatePassword)
router.patch('/users/current/email/request', authMiddleware, otpBlockLimiter, otpCooldownLimiter, userController.requestUpdateEmail)
router.patch('/users/current/email/verify', authMiddleware, userController.verifyUpdateEmail)

export { router }
