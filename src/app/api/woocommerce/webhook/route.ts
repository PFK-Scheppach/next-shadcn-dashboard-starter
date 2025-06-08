import { NextResponse } from 'next/server';
import type { WooOrder } from '@/features/woocommerce/actions/get-orders';
import { sendOrderEmail } from '@/features/woocommerce/actions/send-email';

export async function POST(req: Request) {
  const order = (await req.json()) as WooOrder;
  try {
    await sendOrderEmail(order);
  } catch (err) {
    console.error('Failed to send order email', err);
  }
  return NextResponse.json({ received: true });
}
