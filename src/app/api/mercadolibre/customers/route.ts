import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomers,
  getCustomersByDateRange
} from '@/features/mercadolibre/utils/customers';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  try {
    const customers =
      from && to
        ? await getCustomersByDateRange(new Date(from), new Date(to))
        : await getCustomers();
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error fetching MercadoLibre customers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
