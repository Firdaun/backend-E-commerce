import { productService } from '../services/product.service.js'

const getProducts = async (_, res, next) => {
    try {
        const result = await productService.getAllProducts()
        res.status(200).json({
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const createProduct = async (req, res, next) => {
    try {
        const result = await productService.createProduct(req.body)
        res.status(201).json({
            message: 'Seblak menu successfully added',
            data: result
        })
    } catch (e) {
        next(e)
    }
}

export const productController = {
    getProducts,
    createProduct,
}