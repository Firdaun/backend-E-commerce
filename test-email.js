import 'dotenv/config'
import { sendOtpEmail } from './src/utils/email-util.js'

const runTest = async () => {
    try {
        console.log('Memulai proses koneksi ke SMTP Server...')
        // Ganti parameter pertama dengan email pribadi Anda yang lain untuk melihat hasilnya
        await sendOtpEmail('ketuakls776@gmail.com', '432 596 802')
        console.log('STATUS: SUKSES! Email berhasil terkirim. Silakan cek inbox Anda.')
    } catch (e) {
        console.log('STATUS: GAGAL!')
        console.error(e.message)
    }
}

runTest()