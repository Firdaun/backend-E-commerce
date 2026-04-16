import { prismaClient } from '../application/database.js'
import { createProductValidation } from '../validation/product.validation.js'
import { validate } from '../validation/validation.js'

const getAllProducts = async () => {
    return await prismaClient.product.findMany({
        where: {
            is_available: true
        }
    })
}

const createProduct = async (requestData) => {
    const product = validate(createProductValidation, requestData)

    return await prismaClient.product.create({
        data: product
    })
}

export const productService = {
    getAllProducts,
    createProduct
}