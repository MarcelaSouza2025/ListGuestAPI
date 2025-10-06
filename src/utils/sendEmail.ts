import { getTransporter } from '../config/mailer.js';
import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string; }) {
  const transporter = await getTransporter();
  const from = process.env.MAIL_FROM || 'No-Reply <no-reply@example.com>';
  

  const info = await transporter.sendMail({ from, to, subject, html });
  const preview = nodemailer.getTestMessageUrl?.(info);
  if (preview) console.log('📨 Email preview URL:', preview);
  return info;
}
