import { prismaClient } from '../application/database.js'
import { broadcastOrderToAdmin } from '../application/ws.js'
import { ResponseError } from '../error/response.error.js'
import { createOrderValidation } from '../validation/order.validation.js'
import { validate } from '../validation/validation.js'

const createOrder = async (user, requestData) => {
    const orderReq = validate(createOrderValidation, requestData)

    const productIds = orderReq.orderItems.map(item => item.productId)
    const uniqueProductIds = [...new Set(productIds)]

    const productsInDb = await prismaClient.product.findMany({
        where: {
            id: {in: productIds},
            is_available: true
        }
    })

    if (productsInDb.length !== uniqueProductIds.length) {
        throw new ResponseError(400, 'Some of the ordered menus were not found or were out of stock')
    }

    let total_price = 0

    const itemsWithRealPrice = orderReq.orderItems.map(item => {
        const realProduct = productsInDb.find(p => p.id === item.productId)

        total_price += realProduct.price * item.quantity

        return {
            productId: item.productId,
            quantity: item.quantity,
            spice_level: item.spice_level,
            price_at_purchase: realProduct.price
        }
    })

    const newOrder = await prismaClient.order.create({
        data: {
            userId: user.id,
            username: orderReq.username,
            no_wa: orderReq.no_wa,
            address: orderReq.address,
            total_price: total_price,
            status: 'Menunggu',
            orderItems: {
                create: itemsWithRealPrice
            }
        },
        
        include: {
            orderItems: {
                include: {
                    product: true
                }
            },
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    })

    broadcastOrderToAdmin(newOrder)

    return newOrder
}

const getOrders = async (userId) => {
    return await prismaClient.order.findMany({
        where: {
            userId: userId
        },
        include: {
            orderItems: {
                include: {
                    product: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

const getAllOrders = async () => {
    return prismaClient.order.findMany({
        include: {
            orderItems: {
                include: {
                    product: true
                }
            },
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        },
        orderBy: {
            id: 'desc'
        }
    })
}

export const orderService = {
    createOrder,
    getOrders,
    getAllOrders
}