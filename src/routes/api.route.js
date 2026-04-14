import express from "express"
import { productController } from "../controllers/product.controller.js";
import { orderController } from "../controllers/order.controller.js";
import { userController } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { ordersLimiter, progressiveLoginLimiter } from "../middleware/rate_limiter.middleware.js";

const router = express.Router()

router.get('/products', productController.getProducts)
router.post('/products', productController.createProduct)

router.post('/users/register', userController.register)
router.post('/users/login', progressiveLoginLimiter, userController.login)

router.post('/orders', authMiddleware, ordersLimiter, orderController.createOrder)
router.get('/orders', authMiddleware, orderController.getOrders)

export { router }