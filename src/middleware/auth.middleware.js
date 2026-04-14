import jwt from "jsonwebtoken"

export const authMiddleware = (req, res, next) => {
    const authHeader = req.get('Authorization')

    if (!authHeader) {
        res.status(401).json({
            errors: "Unauthorized: Silakan login terlebih dahulu"
        }).end()
        return
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (e) {
        res.status(401).json({
            errors: "Unauthorized: Token tidak valid atau kedaluwarsa"
        }).end()
    }
}