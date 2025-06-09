export interface PurchaseMessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  isDefault: boolean;
}

export interface MessageVariables {
  buyerName?: string;
  orderNumber?: string;
  productName?: string;
  amount?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  sellerName?: string;
}

// Plantillas predefinidas de mensajes
export const defaultTemplates: PurchaseMessageTemplate[] = [
  {
    id: 'welcome',
    name: 'Mensaje de Bienvenida',
    content:
      '¡Hola {{buyerName}}! 👋 Gracias por tu compra de {{productName}}. Tu pedido #{{orderNumber}} está siendo procesado. Te mantendremos informado sobre el estado de tu envío.',
    variables: ['buyerName', 'productName', 'orderNumber'],
    isDefault: true
  },
  {
    id: 'confirmation',
    name: 'Confirmación de Pago',
    content:
      '¡Perfecto {{buyerName}}! ✅ Hemos confirmado el pago de tu pedido #{{orderNumber}} por ${{amount}}. Comenzaremos a preparar tu envío inmediatamente.',
    variables: ['buyerName', 'orderNumber', 'amount'],
    isDefault: true
  },
  {
    id: 'shipping',
    name: 'Envío Despachado',
    content:
      '📦 ¡Tu pedido ya está en camino {{buyerName}}! Tu {{productName}} ha sido despachado y llegará aproximadamente el {{estimatedDelivery}}. Código de seguimiento: {{trackingNumber}}',
    variables: [
      'buyerName',
      'productName',
      'estimatedDelivery',
      'trackingNumber'
    ],
    isDefault: true
  },
  {
    id: 'followup',
    name: 'Seguimiento Post-Venta',
    content:
      'Hola {{buyerName}}, esperamos que hayas recibido tu {{productName}} en perfectas condiciones. Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Gracias por confiar en nosotros! 🙏',
    variables: ['buyerName', 'productName'],
    isDefault: true
  }
];

// Funciones para gestionar plantillas
export function getTemplate(
  templateId: string
): PurchaseMessageTemplate | undefined {
  return defaultTemplates.find((template) => template.id === templateId);
}

export function getAllTemplates(): PurchaseMessageTemplate[] {
  return defaultTemplates;
}

export function processMessage(
  template: string,
  variables: MessageVariables
): string {
  let processedMessage = template;

  Object.entries(variables).forEach(([key, value]) => {
    if (value) {
      const placeholder = `{{${key}}}`;
      processedMessage = processedMessage.replace(
        new RegExp(placeholder, 'g'),
        value
      );
    }
  });

  // Limpiar variables no reemplazadas
  processedMessage = processedMessage.replace(
    /\{\{[^}]+\}\}/g,
    '[No disponible]'
  );

  return processedMessage;
}

export function validateTemplate(content: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!content.trim()) {
    errors.push('El contenido del mensaje no puede estar vacío');
  }

  if (content.length > 1000) {
    errors.push('El mensaje no puede exceder 1000 caracteres');
  }

  // Verificar variables malformadas
  const malformedVariables = content
    .match(/\{[^}]*\}/g)
    ?.filter((match) => !match.match(/^\{\{[a-zA-Z][a-zA-Z0-9_]*\}\}$/));
  if (malformedVariables && malformedVariables.length > 0) {
    errors.push(
      `Variables malformadas encontradas: ${malformedVariables.join(', ')}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}/g);
  if (!matches) return [];

  return matches.map((match) => match.replace(/\{\{|\}\}/g, ''));
}

export function getAvailableVariables(): Array<{
  key: keyof MessageVariables;
  description: string;
}> {
  return [
    { key: 'buyerName', description: 'Nombre del comprador' },
    { key: 'orderNumber', description: 'Número de orden' },
    { key: 'productName', description: 'Nombre del producto' },
    { key: 'amount', description: 'Monto de la compra' },
    { key: 'estimatedDelivery', description: 'Fecha estimada de entrega' },
    { key: 'trackingNumber', description: 'Número de seguimiento' },
    { key: 'sellerName', description: 'Nombre del vendedor' }
  ];
}

// Función para enviar mensaje automático basado en evento
export async function sendAutomaticMessage(
  orderId: number,
  templateId: string,
  variables: MessageVariables,
  packId?: number,
  buyerUserId?: string
): Promise<boolean> {
  const template = getTemplate(templateId);
  if (!template) {
    console.error(`Template ${templateId} not found`);
    return false;
  }

  const message = processMessage(template.content, variables);

  // Aquí se integraría con la función de envío de MercadoLibre
  // Por ahora, solo simulamos el envío
  try {
    if (!packId || !buyerUserId) {
      console.error(
        'packId and buyerUserId are required for sending buyer messages'
      );
      return false;
    }

    const { sendBuyerMessage } = await import('./mercadolibre');
    return await sendBuyerMessage(packId, message, buyerUserId);
  } catch (error) {
    console.error('Error sending automatic message:', error);
    return false;
  }
}

// Helper para generar mensajes basados en eventos de la orden
export function generateMessageForOrderEvent(
  event: 'payment_confirmed' | 'shipped' | 'delivered' | 'followup',
  orderData: {
    orderId: number;
    buyerName: string;
    productName: string;
    amount?: string;
    estimatedDelivery?: string;
    trackingNumber?: string;
  }
): { templateId: string; message: string } | null {
  let templateId: string;

  switch (event) {
    case 'payment_confirmed':
      templateId = 'confirmation';
      break;
    case 'shipped':
      templateId = 'shipping';
      break;
    case 'delivered':
    case 'followup':
      templateId = 'followup';
      break;
    default:
      return null;
  }

  const template = getTemplate(templateId);
  if (!template) return null;

  const message = processMessage(template.content, {
    buyerName: orderData.buyerName,
    orderNumber: orderData.orderId.toString(),
    productName: orderData.productName,
    amount: orderData.amount,
    estimatedDelivery: orderData.estimatedDelivery,
    trackingNumber: orderData.trackingNumber,
    sellerName: 'Nuestro equipo'
  });

  return { templateId, message };
}
