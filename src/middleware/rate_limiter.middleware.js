import rateLimit from "express-rate-limit"
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
            errors: `Terlalu banyak percobaan login. Coba lagi dalam ${remainingSeconds} detik.`
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
            errors: `Terlalu banyak percobaan login. Coba lagi dalam ${banDurationSeconds} detik.`
        })
    }

    loginTracker.set(ip, tracker)

    // blok check password: kalau login berhasil, reset tracker
    req.resetLoginTracker = () => {
        loginTracker.delete(ip)
    }

    next()
}


export const ordersLimiter = rateLimit({
    windowMs: 3 * 60 * 1000,
    max: 10,
    message: {
        errors: "Sabar bos! Dapur lagi masak pesananmu. Kasih jeda 3 menit kalau mau order lagi."
    }
})