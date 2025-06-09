import { NextRequest, NextResponse } from 'next/server';
import {
  getQuestions,
  getQuestionsByDateRange
} from '@/features/mercadolibre/utils/questions';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    const questions =
      from && to
        ? await getQuestionsByDateRange(new Date(from), new Date(to))
        : await getQuestions();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching MercadoLibre questions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
