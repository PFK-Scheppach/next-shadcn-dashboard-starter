import { NextRequest, NextResponse } from 'next/server';
import { fetchMessageThreadsByDateRange } from '@/lib/mercadolibre';

export async function GET(request: NextRequest) {
  try {
    console.log(
      '🔄 [API] /api/mercadolibre/threads - Fetching message threads'
    );

    // Get query parameters
    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    // Parse dates if provided
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (fromParam && toParam) {
      fromDate = new Date(fromParam);
      toDate = new Date(toParam);
      console.log(
        `📅 [API] Date range: ${fromDate.toISOString()} to ${toDate.toISOString()}`
      );
    } else {
      console.log('📅 [API] Using current month default');
    }

    // Fetch message threads using the new pack-based implementation
    const messageThreads = await fetchMessageThreadsByDateRange(
      fromDate,
      toDate
    );

    console.log(
      `✅ [API] Successfully fetched ${messageThreads.length} message threads`
    );

    return NextResponse.json({
      success: true,
      threads: messageThreads,
      total: messageThreads.length
    });
  } catch (error) {
    console.error('❌ [API] Error fetching message threads:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch message threads',
        threads: [],
        total: 0
      },
      { status: 500 }
    );
  }
}
