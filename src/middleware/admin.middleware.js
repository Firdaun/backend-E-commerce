export const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') { 
        next()
    } else {
        res.status(403).json({
            errors: 'Forbidden: Access denied. Only Admins are allowed to do this'
        })
    }
}