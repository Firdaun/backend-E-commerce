import { userService } from "../services/user.service.js"

const register = async (req, res, next) => {
    try {
        const result = await userService.register(req.body)
        res.status(201).json({
            message: "User berhasil didaftarkan",
            data: result
        })
    } catch (e) {
        next(e)
    }
}

export const userController = {
    register
}