import { productService } from '../services/product.service.js'

const getProducts = async (_req, res, next) => {
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

const updateProduct = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.id)
        const result = await productService.updateProduct(productId, req.body)
        res.status(200).json({
            message: 'Seblak data successfully updated',
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const deleteProduct = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.id)
        await productService.deleteProduct(productId)
        res.status(200).json({
            message: 'Seblak menu successfully removed from the list!'
        })
    } catch (e) {
        next(e)
    }
}

export const productController = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
}