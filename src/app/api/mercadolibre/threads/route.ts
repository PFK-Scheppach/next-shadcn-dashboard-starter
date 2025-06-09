import { NextRequest, NextResponse } from 'next/server';
import {
  getMessageThreads,
  getMessageThreadsByDateRange
} from '@/features/mercadolibre/utils/messages';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    const threads =
      from && to
        ? await getMessageThreadsByDateRange(new Date(from), new Date(to))
        : await getMessageThreads();
    return NextResponse.json({ threads });
  } catch (error) {
    console.error('Error fetching MercadoLibre threads API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}
