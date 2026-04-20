import { prismaClient } from '../application/database.js'
import { broadcastOrderToAdmin } from '../application/ws.js'
import { ResponseError } from '../error/response.error.js'
import { createOrderValidation, updateStatusValidation } from '../validation/order.validation.js'
import { validate } from '../validation/validation.js'

const createOrder = async (user, requestData) => {
    const orderReq = validate(createOrderValidation, requestData)

    let total_price = 0
    const itemsForOrder = []
    let cartIdToClear = null

    if (orderReq.orderItems && orderReq.orderItems.length > 0) {
        // [ 1, 1, 5 ]
        const productIds = orderReq.orderItems.map(item => item.productId)
        // [ 1, 5 ]
        const uniqueProductIds = [...new Set(productIds)]
        // [ {id: 1, nama: "Ori"}, {id: 5, nama: "Ceker"} ]
        const productsInDb = await prismaClient.product.findMany({
            where: {
                id: {
                    in: productIds
                },
                is_available: true
            }
        })

        if (productsInDb.length !== uniqueProductIds.length) {
            throw new ResponseError(400, 'Some of the ordered menus were not found or were out of stock')
        }

        for (const item of orderReq.orderItems) {
            const realProduct = productsInDb.find(p => p.id === item.productId)
            total_price += realProduct.price * item.quantity

            itemsForOrder.push({
                productId: item.productId,
                quantity: item.quantity,
                spice_level: item.spice_level,
                price_at_purchase: realProduct.price
            })
        }
    } else {
        const cart = await prismaClient.cart.findUnique({
            where: { userId: user.id },
            include: {
                cartItems: {
                    include: {
                        product: true 
                    }
                }
            }
        })

        if (!cart || cart.cartItems.length === 0) {
            throw new ResponseError(400, 'Keranjang Anda masih kosong dan Anda tidak mengirimkan data pesanan langsung.')
        }

        for (const item of cart.cartItems) {
            if (!item.product.is_available) {
                throw new ResponseError(400, `Mohon maaf, menu ${item.product.variant} saat ini sedang habis.`)
            }

            total_price += item.product.price * item.quantity

            itemsForOrder.push({
                productId: item.productId,
                quantity: item.quantity,
                spice_level: item.spice_level,
                price_at_purchase: item.product.price
            })
        }

        cartIdToClear = cart.id
    }

    const newOrder = await prismaClient.$transaction(async (prisma) => {
        // 1. Buat Pesanannya
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                username: orderReq.username,
                no_wa: orderReq.no_wa,
                address: orderReq.address,
                total_price: total_price,
                status: 'Menunggu',
                orderItems: {
                    create: itemsForOrder
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

        if (cartIdToClear) {
            await prisma.cartItem.deleteMany({
                where: {
                    cartId: cartIdToClear
                }
            })
        }

        return order
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

const updateOrderStatus = async (orderId, request) => {
    const statusReq = validate(updateStatusValidation, request)

    const orderCount = await prismaClient.order.count({
        where: {
            id: orderId
        }
    })

    if (orderCount === 0) {
        throw new ResponseError(404, 'order not found')
    }

    return prismaClient.order.update({
        where: {
            id: orderId
        },
        data: {
            status: statusReq.status
        },
        include: {
            orderItems: {
                include: {
                    product: true
                }
            }
        }
    })
}

export const orderService = {
    createOrder,
    getOrders,
    getAllOrders,
    updateOrderStatus
}