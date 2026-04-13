import { orderService } from "../services/order.service.js";

const createOrder = async (req, res, next) => {
    try {
        const result = await orderService.createOrder(req.body);
        res.status(201).json({
            message: "Pesanan berhasil dibuat! Segera diproses.",
            data: result
        });
    } catch (error) {
        next(error); 
    }
};

export const orderController = {
    createOrder
};