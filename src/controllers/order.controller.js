import { orderService } from '../services/order.service.js'

const createOrder = async (req, res, next) => {
    try {
        const user = req.user
        const result = await orderService.createOrder(user, req.body)
        res.status(201).json({
            message: 'Order successfully created! Processing soon',
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

const getAllOrders = async (_req, res, next) => {
    try {
        const result = await orderService.getAllOrders()
        res.status(200).json({
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const updateOrderStatus = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.id)
        const result = await orderService.updateOrderStatus(orderId, req.body)
        res.status(200).json({
            message: `Order status #${orderId} successfully changed to ${result.status}`,
            data: result
        })
    } catch (e) {
        next(e)
    }
}

export const orderController = {
    createOrder,
    getOrders,
    getAllOrders,
    updateOrderStatus
}