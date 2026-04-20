import { cartService } from "../services/cart.service.js"

const getCart = async (req, res, next) => {
    try {
        const userId = req.user.id
        const result = await cartService.getCart(userId)
        res.status(200).json({
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const addToCart = async (req, res, next) => {
    try {
        const userId = req.user.id
        const result = await cartService.addToCart(userId, req.body)
        res.status(200).json({
            message: 'Item successfully added to your cart',
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const updateCartItem = async (req, res, next) => {
    try {
        const userId = req.body.id
        const itemId = parseInt(req.params.itemId)
        const result = await cartService.updateCartItem(userId, itemId, req.body)
        res.status(200).json({
            message: 'Cart item successfully updated',
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const removeCartItem = async (req, res, next) => {
    try {
        const userId = req.user.id
        const itemId = parseInt(req.params.itemId)
        await cartService.removeCartItem(userId, itemId)
        res.status(200).json({
            message: 'Item successfully removed from cart'
        })
    } catch (e) {
        next(e)
    }
}

export const cartController = {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem
}