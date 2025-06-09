import { NextRequest, NextResponse } from 'next/server';
import { fetchOrderDetails } from '@/lib/mercadolibre';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const orderId = params.orderId;
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  try {
    const order = await fetchOrderDetails(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const trackingNumber = order.shipping?.tracking_number;
    const status = order.shipping?.status || order.status;
    return NextResponse.json({
      status,
      trackingNumber,
      shipping: order.shipping
    });
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order tracking' },
      { status: 500 }
    );
  }
}
