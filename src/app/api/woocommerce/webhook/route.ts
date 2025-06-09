import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { WooOrder } from '@/features/woocommerce/actions/get-orders';
import {
  sendOrderEmail,
  notifyOrderStatusChange
} from '@/features/woocommerce/actions/send-email';

// Webhook event types from WooCommerce
interface WooCommerceWebhookPayload {
  action: string;
  arg: WooOrder;
}

function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  // WooCommerce sends signature as base64 encoded HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-wc-webhook-signature');
    const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;

    // Verify webhook signature for security
    if (
      webhookSecret &&
      !verifyWebhookSignature(body, signature, webhookSecret)
    ) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: WooCommerceWebhookPayload = JSON.parse(body);
    const order = payload.arg;

    // Handle different webhook events
    const action = payload.action;

    console.log(
      `Received WooCommerce webhook: ${action} for order #${order.id}`
    );

    switch (action) {
      case 'order.created':
      case 'order.updated':
        // Send confirmation email for new orders
        if (order.status === 'processing' || order.status === 'completed') {
          await sendOrderEmail(order, 'confirmation');
        }
        break;

      case 'order.status_changed':
        // Handle status changes
        await notifyOrderStatusChange(order, order.status);
        break;

      default:
        console.log(`Unhandled webhook action: ${action}`);
    }

    return NextResponse.json({
      received: true,
      order_id: order.id,
      action: action
    });
  } catch (error) {
    console.error('Failed to process WooCommerce webhook:', error);

    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint for webhook testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'WooCommerce webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
