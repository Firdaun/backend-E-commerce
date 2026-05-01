import { prismaClient } from '../application/database.js'
import { ResponseError } from '../error/response.error.js'
import { createProductValidation, createBulkProductValidation, getProductByIdValidation, updateProductValidation } from '../validation/product.validation.js'
import { validate } from '../validation/validation.js'

const getProductById = async (id) => {
    const validId = validate(getProductByIdValidation, id);

    // 2. Query ke database
    const product = await prismaClient.product.findUnique({
        where: {
            id: parseInt(validId)
        }
    });

    if (!product) {
        throw new ResponseError(404, "Product not found")
        
    }

    return product;
}

const getAllProducts = async () => {
    return await prismaClient.product.findMany({
        where: {
            is_available: true
        }
    })
}

const createProduct = async (requestData) => {
    if (Array.isArray(requestData)) {
        const products = validate(createBulkProductValidation, requestData)
        return await prismaClient.product.createMany({
            data: products
        })
    } else {
        const product = validate(createProductValidation, requestData)
        return await prismaClient.product.create({
            data: product
        })
    }
}

const updateProduct = async (productId, request) => {
    const productReq = validate(updateProductValidation, request)

    const productExist = await prismaClient.product.count({
        where: {
            id: productId
        }
    })

    if (productExist === 0) {
        throw new ResponseError(404, 'Product not found')
    }

    return prismaClient.product.update({
        where: {
            id: productId
        },
        data: productReq
    })
}

const deleteProduct = async (productId) => {
    const productExist = await prismaClient.product.findUnique({
        where: {
            id: productId
        },
        include: {
            _count:{
                select: {
                    orderItems: true
                }
            }
        }
    })

    if (!productExist) {
        throw new ResponseError(404, 'Product not found')
    }

    if (productExist._count.orderItems > 0) {
        throw new ResponseError(400, 'The product cannot be deleted because it already exists in the order history. Use the Edit feature to deactivate the product')
    }

    return prismaClient.product.delete({
        where: {
            id:productId
        }
    })
}

export const productService = {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById
}