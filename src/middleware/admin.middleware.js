export const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') { 
        next()
    } else {
        res.status(403).json({
            errors: "Forbidden: Akses ditolak. Hanya Admin yang diizinkan melakukan ini."
        })
    }
}