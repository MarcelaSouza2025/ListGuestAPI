import nodemailer from 'nodemailer';
let transporter = null;
export async function getTransporter() {
    if (transporter)
        return transporter;
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT || 587),
            secure: String(SMTP_SECURE || 'false') === 'true',
            auth: { user: SMTP_USER, pass: SMTP_PASS }
        });
    }
    else {
        // fallback Ethereal para dev/teste
        const test = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: test.user, pass: test.pass }
        });
        console.log('📧 Using Ethereal test SMTP');
    }
    return transporter;
}
