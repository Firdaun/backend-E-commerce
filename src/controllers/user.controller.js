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

const login = async (req, res, next) => {
    try {
        const result = await userService.login(req.body)
        res.status(200).json({
            message: "Login berhasil",
            data: result
        })
    } catch (e) {
        next(e)
    }
}

export const userController = {
    register,
    login
}