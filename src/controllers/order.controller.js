import { orderService } from "../services/order.service.js"

const createOrder = async (req, res, next) => {
    try {
        const user = req.user
        const result = await orderService.createOrder(user, req.body)
        res.status(201).json({
            message: "Pesanan berhasil dibuat! Segera diproses.",
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const getOrders = async (req, res, next) => {
    try {
        const userId = req.user.id
        const result = await orderService.getOrders(userId)
        
        res.status(200).json({
            data: result
        })
    } catch (e) {
        next(e)
    }
}

export const orderController = {
    createOrder,
    getOrders
}