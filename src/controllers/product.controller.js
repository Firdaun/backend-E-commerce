import { productService } from "../services/product.service.js"

const getProducts = async (req, res) => {
    try {
        const result = await productService.getAllProducts()
        res.status(200).json({
            data: result
        })
    } catch (error) {
        res.status(500).json({ errors: error.message })
    }
}

const createProduct = async (req, res) => {
    try {
        const result = await productService.createProduct(req.body)
        res.status(201).json({
            message: "Menu seblak berhasil ditambahkan!",
            data: result
        })
    } catch (error) {
        res.status(500).json({ errors: error.message })
    }
}

export const productController = {
    getProducts,
    createProduct
};