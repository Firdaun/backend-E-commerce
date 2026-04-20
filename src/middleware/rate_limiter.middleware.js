import rateLimit from 'express-rate-limit'


// LOGIN LIMITER

const loginTracker = new Map()
export const progressiveLoginLimiter = (req,res, next) => {
    const ip = req.ip
    const now = Date.now()
    
    let tracker =
        // user yg sudah pernah gagal login
        loginTracker.get(ip)
    || {
        // user baru dan belum pernah gagal login
        attempts: 0, // berapa kali orang ini gagal
        blockUntil: 0, // di blokir sampai
        penaltylevel: 1, // tingkat hukuman
        lastAttempt: 0 // terakhir kali IP mecoba login
    }
    
    // blok pengampunan: kalau sudah lebih dari 1 jam sejak percobaan terakhir dan sudah melewati masa blokir, reset tracker
    if (tracker.lastAttempt !== 0 && now - tracker.lastAttempt > 60 * 60 * 1000 && now > tracker.blockUntil) {
        tracker.attempts = 0
        tracker.penaltylevel = 1
    }

    tracker.lastAttempt = now

    // blok hukuman: cek apakah masih diblokir
    if (now < tracker.blockUntil) {
        const remainingSeconds = Math.ceil((tracker.blockUntil - now) / 1000)
        return res.status(429).json({
            errors: `Too many login attempts. Please try again in ${remainingSeconds} seconds`
        })
    }

    tracker.attempts += 1

    // blok penjatuhan hukuman: cek apakah sudah mencapai batas percobaan
    if (tracker.attempts >= 5) {
        const banDurationSeconds = 30 * Math.pow(2, tracker.penaltylevel - 1)

        tracker.blockUntil = now + banDurationSeconds * 1000
        tracker.penaltylevel += 1
        tracker.attempts = 0

        loginTracker.set(ip, tracker)

        return res.status(429).json({
            errors: `Too many login attempts. Please try again in ${banDurationSeconds} seconds`
        })
    }

    loginTracker.set(ip, tracker)

    // blok check password: kalau login berhasil, reset tracker
    req.resetLoginTracker = () => {
        loginTracker.delete(ip)
    }

    next()
}


// ORDER LIMITER

export const ordersLimiter = rateLimit({
    windowMs: 3 * 60 * 1000,
    max: 10,
    handler: (req, res, _, option) => {
        const remainingSeconds = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / (1000 * 60))
        res.status(option.statusCode).json({
            errors: `Please be patient! The kitchen is cooking your order. Please allow ${remainingSeconds} minutes for another order`
        })
    }
})


// OTP LIMITER

const isTestEnv = () => process.env.NODE_ENV === 'test'
export const otpCooldownLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1,
    skip: isTestEnv,
    handler: (req, res, _next, options) => {
        const remainingSeconds = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
        res.status(options.statusCode).json({
            errors: `Please wait ${remainingSeconds} seconds before requesting OTP again.`
        })
    },
    standardHeaders: true,
    legacyHeaders: false,
})

export const otpBlockLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 3,
    skip: isTestEnv,
    skipFailedRequests: true,
    handler: (req, res, _next, options) => {
        const remainingMs = req.rateLimit.resetTime.getTime() - Date.now()
        const totalMinutes = Math.ceil(remainingMs / (1000 * 60))
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        let timeText = hours > 0 ? `${hours} hours and ${minutes} minutes` : `${minutes} minutes`

        res.status(options.statusCode).json({
            errors: `You have reached the maximum number of OTP requests. Your IP address is blocked from this feature for ${timeText}.`
        })
    },
    standardHeaders: true,
    legacyHeaders: false,
})


// REGISTER LIMITER

export const registerLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 3,
    skip: isTestEnv,
    handler: (req, res, _, options) => {
        const remainingHours = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / (1000 * 60 * 60))
        res.status(options.statusCode).json({
            errors: `There are too many account creation requests from this IP address. Please try again in ${remainingHours} hours.`
        })
    },
    standardHeaders: true,
    legacyHeaders: false,
})