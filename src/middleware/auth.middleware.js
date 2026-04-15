import jwt from "jsonwebtoken"
import { prismaClient } from "../application/database.js"

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.get('x-api-key')

    if (!authHeader) {
        res.status(401).json({
            errors: "Unauthorized: Silakan login terlebih dahulu"
        })
        return
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const session = await prismaClient.session.findUnique({
            where: {
                token: token
            }
        })
        if (!session) {
            return res.status(401).json({
                errors: "Unauthorized: Sesi telah berakhir. Silakan login kembali."
            })
        }
        req.user = decoded
        req.token = token
        next()
    } catch (e) {
        res.status(401).json({
            errors: "Unauthorized: Token tidak valid atau kedaluwarsa"
        })
    }
}