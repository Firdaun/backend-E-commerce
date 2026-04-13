import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response.error.js"
import { createOrderValidation } from "../validation/order.validation.js"
import { validate } from "../validation/validation.js"

const createOrder = async (requestData) => {
    const orderReq = validate(createOrderValidation, requestData)

    const productIds = orderReq.items.map(item => item.productId)

    const productsInDb = await prismaClient.product.findMany({
        where: {
            id: {in: productIds},
            is_available: true
        }
    })

    if (productsInDb.length !== productIds.length) {
        throw new ResponseError(400, "Beberapa menu yang dipesan tidak ditemukan atau sedang habis")
    }

    let total_price = 0

    const itemsWithRealPrice = orderReq.items.map(item => {
        const realProduct = productsInDb.find(p => p.id === item.productId)

        total_price += realProduct.price * item.quantity

        return {
            productId: item.productId,
            quantity: item.quantity,
            spice_level: item.spice_level,
            price_at_purchase: realProduct.price
        }
    })

    return await prismaClient.order.create({
        data: {
            username: orderReq.username,
            no_wa: orderReq.no_wa,
            address: orderReq.address,
            total_price: total_price,
            status: "PENDING",
            items: {
                create: itemsWithRealPrice
            }
        },
        include: {
            items: true
        }
    })
}

export const orderService = {
    createOrder
};