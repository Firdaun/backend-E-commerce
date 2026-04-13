import express from "express"
import { productController } from "../controllers/product.controller.js";

const router = express.Router()

router.get('/products', productController.getProducts); // Ambil data
router.post('/products', productController.createProduct); // Tambah data

export { router }