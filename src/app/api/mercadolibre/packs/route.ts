import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from '@/lib/mercadolibre-token-manager';

// Helper function to handle token refresh
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = process.env.MERCADOLIBRE_REFRESH_TOKEN;
  const clientId = process.env.MERCADOLIBRE_CLIENT_ID;
  const clientSecret = process.env.MERCADOLIBRE_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    console.warn('❌ MercadoLibre refresh credentials not provided');
    return null;
  }

  try {
    console.log('🔄 Refreshing MercadoLibre access token...');
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Failed to refresh MercadoLibre token:', errorText);
      return null;
    }

    const data = await res.json();
    console.log('✅ Token refreshed successfully');
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing MercadoLibre token:', error);
    return null;
  }
}

// Helper function to make API calls with automatic token refresh
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let accessToken: string | undefined = process.env.MERCADOLIBRE_ACCESS_TOKEN;

  if (!accessToken) {
    console.log('🔄 No access token found, attempting to refresh...');
    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
      throw new Error('No access token available');
    }
    accessToken = refreshedToken;
  }

  // First attempt with current token
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  // If unauthorized, try refreshing token and retry
  if (response.status === 401) {
    console.log('🔄 Token expired, refreshing and retrying...');
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error('Failed to refresh access token');
    }

    // Retry with new token
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  return response;
}

// Function to get message count for a pack - using CORRECT endpoint
async function getPackMessageCount(
  packId: string,
  sellerId: string
): Promise<number> {
  try {
    // Use the CORRECT endpoint according to official documentation
    const messagesUrl = `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale&mark_as_read=false&limit=50`;
    console.log(`🔍 [API] Checking messages for pack ${packId}`);

    const response = await authenticatedFetch(messagesUrl, { method: 'GET' });

    if (response.ok) {
      const data = await response.json();
      const messageCount = data.messages ? data.messages.length : 0;
      console.log(`✅ [API] Pack ${packId} has ${messageCount} messages`);
      return messageCount;
    } else {
      console.warn(`⚠️ [API] Failed for pack ${packId}: ${response.status}`);
      return 0;
    }
  } catch (error) {
    console.error(`❌ Error fetching message count for pack ${packId}:`, error);
    return 0;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log(`📦 [API] Obteniendo packs de conversaciones`, {
      limit,
      offset
    });

    const access_token = await tokenManager.getValidToken();

    if (!access_token) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    const sellerId = process.env.MERCADOLIBRE_SELLER_ID;

    // Primero obtenemos las órdenes recientes con pack_id
    const ordersUrl = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&sort=date_desc&limit=${limit}&offset=${offset}`;

    console.log(`🔄 Fetching orders from: ${ordersUrl}`);

    const ordersResponse = await fetch(ordersUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      const errorData = await ordersResponse.json();
      console.error(`❌ Error fetching orders:`, errorData);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: errorData },
        { status: ordersResponse.status }
      );
    }

    const ordersData = await ordersResponse.json();
    const orders = ordersData.results || [];

    // Filtrar órdenes que tienen pack_id y agrupar por pack
    const packsMap = new Map();

    for (const order of orders) {
      if (order.pack_id) {
        const packId = order.pack_id.toString();

        if (!packsMap.has(packId)) {
          packsMap.set(packId, {
            id: packId,
            order_id: order.id,
            stage: order.status,
            message_count: 0,
            has_unread_messages: false,
            buyer: {
              id: order.buyer.id,
              nickname: order.buyer.nickname
            },
            seller: {
              id: order.seller.id,
              nickname: order.seller.nickname
            },
            date_created: order.date_created,
            last_message_date: order.date_created
          });
        }
      }
    }

    const packs = Array.from(packsMap.values());

    console.log(
      `✅ [API] Found ${packs.length} packs from ${orders.length} orders`
    );

    return NextResponse.json({
      packs: packs,
      total: packs.length,
      paging: {
        limit,
        offset,
        total: packs.length
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching packs:', error);

    return NextResponse.json(
      { error: 'Failed to fetch packs', message: error.message },
      { status: 500 }
    );
  }
}
