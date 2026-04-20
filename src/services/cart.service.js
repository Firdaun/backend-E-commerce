import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response.error.js"
import { addToCartValidation, updateCartItemValidation } from "../validation/cart.validation.js"
import { validate } from "../validation/validation.js"

const getCart = async (userId) => {
    let cart = await prismaClient.cart.findUnique({
        where: {
            userId: userId
        },
        include: {
            cartItems: {
                include: {
                    product: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    })

    if (!cart) {
        cart = await prismaClient.cart.create({
            data: {
                userId: userId
            },
            include: {
                cartItems: true
            }
        })
    }

    let estimatedTotal = 0
    if (cart.cartItems && cart.cartItems.length > 0) {
        cart.cartItems.forEach(item => {
            estimatedTotal += (item.product.price * item.quantity)
        })
    }

    return {
        ...cart,
        estimated_total: estimatedTotal
    }
}

const addToCart = async (userId, request) => {
    const itemReq = validate(addToCartValidation, request)

    const product = await prismaClient.product.findUnique({
        where: {
            id: itemReq.productId
        }
    })

    if (!product || !product.is_available) {
        throw new ResponseError(400, 'Product is not found or out of stock')
    }

    const cart = await getCart(userId)

    const existingItem = await prismaClient.cartItem.findFirst({
        where: {
            cartId: cart.id,
            productId: itemReq.productId,
            spice_level: itemReq.spice_level
        }
    })

    if (existingItem) {
        return prismaClient.cartItem.update({
            where: {
                id: existingItem.id
            },
            data: {
                quantity: existingItem.quantity + itemReq.quantity
            },
            include: {
                product: true
            }
        })
    } else {
        return prismaClient.cartItem.create({
            data: {
                cartId: cart.id,
                productId: itemReq.productId,
                quantity: itemReq.quantity,
                spice_level: itemReq.spice_level
            },
            include: {
                product: true
            }
        })
    }
}

const updateCartItem = async (userId, itemId, request) => {
    const updateReq = validate(updateCartItemValidation, request)

    const cartItem = await prismaClient.cartItem.findFirst({
        where: {
            id: itemId,
            cart: {
                userId: userId
            }
        }
    })

    if (!cartItem) {
        throw new ResponseError(404, 'Cart item not found')
    }

    return prismaClient.cartItem.update({
        where: {
            id: itemId
        },
        data: updateReq,
        include: {
            product: true
        }
    })
}

const removeCartItem = async (userId, itemId) => {
    const cartItem = await prismaClient.cartItem.findFirst({
        where: {
            id: itemId,
            cart: {
                userId: userId
            }
        }
    })

    if (!cartItem) {
        throw new ResponseError(404, 'Cart item not found')
    }

    await prismaClient.cartItem.delete({
        where: {
            id: itemId
        }
    })
}

export const cartService = {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem
}