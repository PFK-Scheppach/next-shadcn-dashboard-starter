import { NextRequest, NextResponse } from 'next/server';
import { sendOrderEmail } from '@/features/woocommerce/actions/send-email';
import type { WooOrder } from '@/features/woocommerce/actions/get-orders';

interface SendEmailRequest {
  order: WooOrder;
  type: 'confirmation' | 'shipped';
  trackingNumber?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SendEmailRequest = await req.json();
    const { order, type, trackingNumber } = body;

    // Validate request
    if (!order || !order.id || !order.billing?.email) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    if (!['confirmation', 'shipped'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      );
    }

    // Send email
    const success = await sendOrderEmail(order, type, trackingNumber);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Email ${type} sent successfully to ${order.billing.email}`,
        orderId: order.id
      });
    } else {
      return NextResponse.json(
        {
          error: 'Failed to send email',
          message: 'Check SMTP configuration and try again'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in send-email API:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing email configuration
export async function GET() {
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM'
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  return NextResponse.json({
    status: missingVars.length === 0 ? 'configured' : 'missing_config',
    message:
      missingVars.length === 0
        ? 'Email configuration is complete'
        : `Missing environment variables: ${missingVars.join(', ')}`,
    missingVariables: missingVars,
    timestamp: new Date().toISOString()
  });
}
