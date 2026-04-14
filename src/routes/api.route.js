import express from "express"
import { productController } from "../controllers/product.controller.js";
import { orderController } from "../controllers/order.controller.js";
import { userController } from "../controllers/user.controller.js";

const router = express.Router()

router.get('/products', productController.getProducts)
router.post('/products', productController.createProduct)

router.post('/orders', orderController.createOrder)

router.post('/users/register', userController.register)

export { router }