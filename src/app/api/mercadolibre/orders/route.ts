import { NextRequest, NextResponse } from 'next/server';
import { fetchOrders, fetchOrdersByDateRange } from '@/lib/mercadolibre';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    const orders =
      from && to ? await fetchOrdersByDateRange(from, to) : await fetchOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching MercadoLibre orders API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
