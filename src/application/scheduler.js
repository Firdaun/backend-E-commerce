import cron from 'node-cron'
import { prismaClient } from './database.js'

export const initScheduler = () => {
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date()
            
            const deleted = await prismaClient.otp.deleteMany({
                where: {
                    expiresAt: {
                        lt: now
                    }
                }
            })

            if (deleted.count > 0) {
                console.log(`[CRON] Berhasil menghapus ${deleted.count} OTP yang sudah expired.`)
            }
        } catch (e) {
            console.error('[CRON] Gagal membersihkan OTP expired:', e)
        }
    })
    
    console.log('Scheduler (Cron Jobs) has been initialized')
}