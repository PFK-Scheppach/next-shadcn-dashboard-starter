import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from '@/lib/mercadolibre-token-manager';

interface AttemptResult {
  endpoint: string;
  status: number | string;
  success: boolean;
  data: any;
  error: any;
}

interface SearchResults {
  order_id: string;
  messages: any[];
  attempts: AttemptResult[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [API] Searching messages for order ${orderId}`);

    const access_token = await tokenManager.getValidToken();

    if (!access_token) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    const endpoints = [
      // Try messages by order ID
      `https://api.mercadolibre.com/messages/orders/${orderId}`,
      // Try messages search with order filter
      `https://api.mercadolibre.com/messages/search?order_id=${orderId}`,
      // Try messages with seller and order
      `https://api.mercadolibre.com/messages/search?seller_id=${process.env.MERCADOLIBRE_SELLER_ID}&order_id=${orderId}`
    ];

    const results: SearchResults = {
      order_id: orderId,
      messages: [],
      attempts: []
    };

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      console.log(`🔍 [${i + 1}] Trying endpoint: ${endpoint}`);

      try {
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        results.attempts.push({
          endpoint,
          status: response.status,
          success: response.ok,
          data: response.ok ? data : null,
          error: !response.ok ? data : null
        });

        if (response.ok && data) {
          console.log(`✅ [${i + 1}] Success with ${endpoint}`);
          console.log(
            `📊 Response type: ${typeof data}, keys: ${Object.keys(data).join(', ')}`
          );

          // Handle different response formats
          if (data.results) {
            results.messages.push(...data.results);
          } else if (Array.isArray(data)) {
            results.messages.push(...data);
          } else if (data.elements) {
            results.messages.push(...data.elements);
          } else if (data.messages) {
            results.messages.push(...data.messages);
          } else {
            results.messages.push(data);
          }
        } else {
          console.log(
            `❌ [${i + 1}] Failed with status ${response.status}:`,
            JSON.stringify(data).slice(0, 200)
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ [${i + 1}] Error with ${endpoint}:`, error);
        results.attempts.push({
          endpoint,
          status: 'error',
          success: false,
          data: null,
          error: errorMessage
        });
      }
    }

    console.log(
      `📊 Found ${results.messages.length} messages for order ${orderId}`
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching messages for order:', error);
    return NextResponse.json(
      { error: 'Failed to search messages for order' },
      { status: 500 }
    );
  }
}
