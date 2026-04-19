import { userService } from '../services/user.service.js'

const register = async (req, res, next) => {
    try {
        const result = await userService.register(req.body)
        res.status(201).json({
            message: 'User has been successfully registered',
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const login = async (req, res, next) => {
    try {
        const ipAddress = req.ip || 'Unknown IP'
        const deviceInfo = req.get('User-Agent') || 'Unknown Device'

        const result = await userService.login(req.body, ipAddress, deviceInfo)

        if (req.resetLoginTracker) {
            req.resetLoginTracker()
        }

        res.status(200).json({
            message: 'Login successful',
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const logout = async (req, res, next) => {
    try {
        const result = await userService.logout(req.token)

        res.status(200).json({
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const getCurrentUser = async (req, res, next) => {
    try {
        const userId = req.user.id
        const result = await userService.getCurrentUser(userId)
        res.status(200).json({
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id
        const result = await userService.updateProfile(userId, req.body)
        res.status(200).json({
            message: 'Profile seccessfully updated',
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const updatePassword = async (req, res, next) => {
    try {
        const userId = req.user.id
        await userService.updatePassword(userId, req.body)
        res.status(200).json({
            message: 'Password successfully updated'
        })
    } catch (e) {
        next(e)
    }
}

const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.id
        await userService.deleteAccount(userId, req.body)
        
        res.status(200).json({
            message: 'Account successfully deleted'
        })
    } catch (e) {
        next(e)
    }
}

const requestPasswordReset = async (req, res, next) => {
    try {
        await userService.requestPasswordReset(req.body)
        res.status(200).json({
            message: 'Password reset OTP has been sent to your email'
        })
    } catch (e) {
        next(e)
    }
}

const resetPassword = async (req, res, next) => {
    try {
        await userService.resetPassword(req.body)
        res.status(200).json({
            message: 'Password has been successfully reset. Please log in with your new password.'
        })
    } catch (e) {
        next(e)
    }
}

const verifyEmail = async (req, res, next) => {
    try {
        await userService.verifyEmail(req.body)
        res.status(200).json({
            message: 'Email successfully verified. You can now login.'
        })
    } catch (e) {
        next(e)
    }
}

const resendVerificationEmail = async (req, res, next) => {
    try {
        await userService.resendVerificationEmail(req.body)
        res.status(200).json({
            message: 'A new verification OTP has been sent to your email'
        })
    } catch (e) {
        next(e)
    }
}

export const userController = {
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    updatePassword,
    deleteAccount,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail
}