import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})

export const sendOtpEmail = async (to, otpCode) => {
    const mailOptions = {
        from: `"E-Commerce Support" <${process.env.SMTP_USER}>`,
        to: to,
        subject: 'Verifikasi Kode OTP Anda',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #333; text-align: center;">Kode Keamanan OTP</h2>
                <p style="color: #555; font-size: 16px;">Kami menerima permintaan yang membutuhkan verifikasi email. Berikut adalah kode rahasia Anda:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4CAF50; background: #f9f9f9; padding: 15px 30px; border-radius: 8px; border: 1px dashed #ccc;">
                        ${otpCode}
                    </span>
                </div>
                <p style="color: #555; font-size: 16px;">Kode ini hanya berlaku selama <strong>5 menit</strong>. Jangan pernah membagikan kode ini kepada siapa pun.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini dan segera ubah password Anda.</p>
            </div>
        `
    }
    await transporter.sendMail(mailOptions)
}