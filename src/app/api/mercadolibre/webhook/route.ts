import { NextRequest, NextResponse } from 'next/server';
import {
  sendAutomaticMessage,
  generateMessageForOrderEvent
} from '@/lib/purchase-message';

// Simple notification broadcaster (in production, use Redis or message queue)
async function sendNotification(message: string, type: string = 'info') {
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notifications/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type })
      }
    );
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// MercadoLibre webhook notification types
interface MercadoLibreNotification {
  _id: string;
  resource: string;
  user_id: string;
  topic: string;
  application_id: string;
  attempts: number;
  sent: string;
  received: string;
}

// Order status mapping for automatic messages
const ORDER_EVENT_MAPPING = {
  orders_v2: 'payment_confirmed',
  merchant_orders: 'shipped'
} as const;

export async function POST(req: NextRequest) {
  try {
    const notification: MercadoLibreNotification = await req.json();

    console.log('Received MercadoLibre notification:', {
      topic: notification.topic,
      resource: notification.resource,
      userId: notification.user_id
    });

    // Validate that this notification is for our application
    const expectedUserId = process.env.MERCADOLIBRE_SELLER_ID;
    if (expectedUserId && notification.user_id !== expectedUserId) {
      console.warn('Notification from unexpected user:', notification.user_id);
      return NextResponse.json({ received: true }); // Still return success to avoid retries
    }

    // Handle different notification topics
    switch (notification.topic) {
      case 'orders_v2':
        await handleOrderNotification(notification);
        break;

      case 'questions':
        await handleQuestionNotification(notification);
        break;

      case 'messages':
        await handleMessageNotification(notification);
        break;

      case 'merchant_orders':
        await handleMerchantOrderNotification(notification);
        break;

      default:
        console.log(`Unhandled notification topic: ${notification.topic}`);
    }

    return NextResponse.json({
      received: true,
      timestamp: new Date().toISOString(),
      topic: notification.topic
    });
  } catch (error) {
    console.error('Error processing MercadoLibre webhook:', error);

    // Return success to prevent MercadoLibre from retrying
    // Log the error for manual investigation
    return NextResponse.json({
      received: true,
      error: 'Processing failed but acknowledged'
    });
  }
}

async function handleOrderNotification(notification: MercadoLibreNotification) {
  try {
    // Extract order ID from resource URL
    const orderId = extractResourceId(notification.resource);
    if (!orderId) return;

    // Send real-time notification
    await sendNotification(
      `Nueva orden recibida en MercadoLibre: #${orderId}`,
      'order'
    );

    // Fetch order details from MercadoLibre API
    const orderDetails = await fetchOrderDetails(orderId);
    if (!orderDetails) return;

    // Generate and send automatic message
    const messageData = generateMessageForOrderEvent('payment_confirmed', {
      orderId: parseInt(orderId),
      buyerName: orderDetails.buyer?.nickname || 'Cliente',
      productName: orderDetails.order_items?.[0]?.item?.title || 'Tu producto',
      amount: orderDetails.total_amount?.toString()
    });

    if (messageData) {
      await sendAutomaticMessage(parseInt(orderId), messageData.templateId, {
        buyerName: orderDetails.buyer?.nickname || 'Cliente',
        orderNumber: orderId,
        productName:
          orderDetails.order_items?.[0]?.item?.title || 'Tu producto',
        amount: orderDetails.total_amount?.toString()
      });

      console.log(`Automatic message sent for order ${orderId}`);

      // Notify about automatic message sent
      await sendNotification(
        `Mensaje automático enviado para orden #${orderId}`,
        'success'
      );
    }
  } catch (error) {
    console.error('Error handling order notification:', error);
    await sendNotification(`Error procesando orden de MercadoLibre`, 'error');
  }
}

async function handleQuestionNotification(
  notification: MercadoLibreNotification
) {
  try {
    const questionId = extractResourceId(notification.resource);
    if (!questionId) return;

    // Send real-time notification
    await sendNotification(
      `Nueva pregunta recibida en MercadoLibre: #${questionId}`,
      'question'
    );

    console.log(`New question received: ${questionId}`);

    // TODO: Implement automatic responses for common questions
  } catch (error) {
    console.error('Error handling question notification:', error);
  }
}

async function handleMessageNotification(
  notification: MercadoLibreNotification
) {
  try {
    const messageId = extractResourceId(notification.resource);
    if (!messageId) return;

    // Send real-time notification
    await sendNotification(
      `Nuevo mensaje recibido en MercadoLibre: #${messageId}`,
      'message'
    );

    console.log(`New message received: ${messageId}`);

    // TODO: Implement message processing
    // Could check for keywords and send automatic responses
  } catch (error) {
    console.error('Error handling message notification:', error);
  }
}

async function handleMerchantOrderNotification(
  notification: MercadoLibreNotification
) {
  try {
    const merchantOrderId = extractResourceId(notification.resource);
    if (!merchantOrderId) return;

    // Fetch merchant order details to check status
    const orderDetails = await fetchMerchantOrderDetails(merchantOrderId);
    if (!orderDetails) return;

    // Check if order is shipped
    if (
      orderDetails.status === 'shipped' ||
      orderDetails.status === 'delivered'
    ) {
      // Send real-time notification
      await sendNotification(
        `Orden enviada en MercadoLibre: #${orderDetails.id}`,
        'order'
      );

      // Generate shipping notification
      const messageData = generateMessageForOrderEvent('shipped', {
        orderId: orderDetails.id,
        buyerName: 'Cliente', // MercadoLibre might not provide buyer name in merchant orders
        productName:
          orderDetails.order_items?.[0]?.item?.title || 'Tu producto',
        trackingNumber: orderDetails.shipments?.[0]?.tracking_number
      });

      if (messageData) {
        await sendAutomaticMessage(orderDetails.id, messageData.templateId, {
          buyerName: 'Cliente',
          orderNumber: orderDetails.id.toString(),
          productName:
            orderDetails.order_items?.[0]?.item?.title || 'Tu producto',
          trackingNumber: orderDetails.shipments?.[0]?.tracking_number
        });

        console.log(`Shipping notification sent for order ${orderDetails.id}`);

        // Notify about shipping message sent
        await sendNotification(
          `Notificación de envío enviada para orden #${orderDetails.id}`,
          'success'
        );
      }
    }
  } catch (error) {
    console.error('Error handling merchant order notification:', error);
  }
}

function extractResourceId(resourceUrl: string): string | null {
  // Extract ID from resource URL like "/orders/123456789" or "/questions/123456789"
  const match = resourceUrl.match(/\/\w+\/(\d+)$/);
  return match ? match[1] : null;
}

async function fetchOrderDetails(orderId: string): Promise<any> {
  try {
    const accessToken = process.env.MERCADOLIBRE_ACCESS_TOKEN;
    if (!accessToken) return null;

    const response = await fetch(
      `https://api.mercadolibre.com/orders/${orderId}?access_token=${accessToken}`
    );
    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
}

async function fetchMerchantOrderDetails(
  merchantOrderId: string
): Promise<any> {
  try {
    const accessToken = process.env.MERCADOLIBRE_ACCESS_TOKEN;
    if (!accessToken) return null;

    const response = await fetch(
      `https://api.mercadolibre.com/merchant_orders/${merchantOrderId}?access_token=${accessToken}`
    );
    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error('Error fetching merchant order details:', error);
    return null;
  }
}

// GET endpoint for webhook validation (MercadoLibre requirement)
export async function GET(req: NextRequest) {
  // MercadoLibre sends a verification request when setting up webhooks
  const searchParams = req.nextUrl.searchParams;
  const challenge = searchParams.get('hub.challenge');

  if (challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return NextResponse.json({
    status: 'ok',
    message: 'MercadoLibre webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
