import nodemailer from 'nodemailer';
import type { WooOrder } from './get-orders';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Email templates for different order statuses
export const emailTemplates = {
  orderConfirmation: (order: WooOrder): EmailTemplate => ({
    subject: `¡Gracias por tu compra! Orden #${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">¡Gracias por tu compra!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Hola ${order.billing.first_name},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Hemos recibido tu pedido y lo estamos procesando. Te enviaremos una confirmación 
            cuando tu pedido haya sido enviado.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Detalles del Pedido</h3>
            <p><strong>Número de Orden:</strong> #${order.id}</p>
            <p><strong>Fecha:</strong> ${new Date(order.date_created).toLocaleDateString('es-ES')}</p>
            <p><strong>Total:</strong> $${order.total} ${order.currency}</p>
            <p><strong>Estado:</strong> ${getOrderStatusText(order.status)}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Dirección de Envío</h3>
            <p>
              ${order.shipping.first_name} ${order.shipping.last_name}<br>
              ${order.shipping.address_1}<br>
              ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postcode}<br>
              ${order.shipping.country}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders/${order.id}" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Ver Detalles del Pedido
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Tu Tienda. Todos los derechos reservados.</p>
        </div>
      </div>
    `,
    text: `
Hola ${order.billing.first_name},

¡Gracias por tu compra!

Detalles del Pedido:
- Número de Orden: #${order.id}
- Fecha: ${new Date(order.date_created).toLocaleDateString('es-ES')}
- Total: $${order.total} ${order.currency}
- Estado: ${getOrderStatusText(order.status)}

Dirección de Envío:
${order.shipping.first_name} ${order.shipping.last_name}
${order.shipping.address_1}
${order.shipping.city}, ${order.shipping.state} ${order.shipping.postcode}
${order.shipping.country}

Hemos recibido tu pedido y lo estamos procesando. Te enviaremos una confirmación cuando tu pedido haya sido enviado.

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
Tu Tienda
    `
  }),

  orderShipped: (order: WooOrder, trackingNumber?: string): EmailTemplate => ({
    subject: `Tu pedido #${order.id} ha sido enviado`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">¡Tu pedido está en camino!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Hola ${order.billing.first_name},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            ¡Buenas noticias! Tu pedido #${order.id} ha sido enviado y está en camino.
          </p>
          
          ${
            trackingNumber
              ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Información de Seguimiento</h3>
            <p><strong>Número de Seguimiento:</strong> ${trackingNumber}</p>
            <p>Puedes rastrear tu paquete con este número en la página del transportista.</p>
          </div>
          `
              : ''
          }
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders/${order.id}" 
               style="background: #48bb78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Rastrear Pedido
            </a>
          </div>
        </div>
      </div>
    `,
    text: `
Hola ${order.billing.first_name},

¡Tu pedido #${order.id} ha sido enviado!

${trackingNumber ? `Número de Seguimiento: ${trackingNumber}` : ''}

Puedes rastrear tu pedido en: ${process.env.NEXT_PUBLIC_SITE_URL}/orders/${order.id}

Saludos,
Tu Tienda
    `
  })
};

function getOrderStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    'on-hold': 'En espera',
    completed: 'Completado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    failed: 'Fallido'
  };

  return statusMap[status] || status;
}

function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    console.warn('Missing SMTP environment variables');
    return null;
  }

  return {
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
    from
  };
}

export async function sendOrderEmail(
  order: WooOrder,
  type: 'confirmation' | 'shipped' = 'confirmation',
  trackingNumber?: string
): Promise<boolean> {
  const config = getEmailConfig();
  if (!config) {
    return false;
  }

  try {
    const transporter = nodemailer.createTransport(config);

    // Verify transporter configuration
    await transporter.verify();

    const template =
      type === 'shipped'
        ? emailTemplates.orderShipped(order, trackingNumber)
        : emailTemplates.orderConfirmation(order);

    const result = await transporter.sendMail({
      from: config.from,
      to: order.billing.email,
      subject: template.subject,
      text: template.text,
      html: template.html
    });

    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send order email:', error);
    return false;
  }
}

export async function sendBulkOrderEmails(
  orders: WooOrder[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const order of orders) {
    const success = await sendOrderEmail(order);
    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Add delay to avoid overwhelming the SMTP server
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { sent, failed };
}

// Email notification for specific order events
export async function notifyOrderStatusChange(
  order: WooOrder,
  newStatus: string,
  oldStatus?: string
): Promise<boolean> {
  // Only send emails for specific status changes
  const notifiableStatuses = ['processing', 'completed', 'shipped'];

  if (!notifiableStatuses.includes(newStatus)) {
    return false;
  }

  const type =
    newStatus === 'shipped' || newStatus === 'completed'
      ? 'shipped'
      : 'confirmation';
  return await sendOrderEmail(order, type);
}
