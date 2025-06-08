import nodemailer from 'nodemailer';
import type { WooOrder } from './get-orders';

export async function sendOrderEmail(order: WooOrder) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    console.error('Missing SMTP environment variables');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: {
      user,
      pass
    }
  });

  await transporter.sendMail({
    from,
    to: order.billing.email,
    subject: 'Thank you for your purchase!',
    text: `Hi ${order.billing.first_name}, thanks for your order (#${order.id}).`
  });
}
