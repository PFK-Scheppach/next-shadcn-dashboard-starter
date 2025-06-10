import { NextResponse } from 'next/server';

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
      console.error(`❌ Token refresh failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing access token:', error);
    return null;
  }
}

// Function to make authenticated requests to MercadoLibre API
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let accessToken = process.env.MERCADOLIBRE_ACCESS_TOKEN;

  const makeRequest = async (token: string) => {
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  };

  let response = await makeRequest(accessToken!);

  if (response.status === 401) {
    console.log('🔄 Access token expired, attempting refresh...');
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      accessToken = newAccessToken;
      response = await makeRequest(accessToken);
    } else {
      throw new Error('Unable to refresh access token');
    }
  }

  return response;
}

export async function GET() {
  try {
    console.log(
      '🔍 [UnreadMessages] Getting unread messages using official MercadoLibre API...'
    );

    // Usar el endpoint oficial de mensajes no leídos
    const unreadUrl =
      'https://api.mercadolibre.com/messages/unread?role=seller&tag=post_sale';
    console.log(`🔍 [UnreadMessages] URL: ${unreadUrl}`);

    const response = await authenticatedFetch(unreadUrl, {
      method: 'GET'
    });

    if (!response.ok) {
      console.error(
        `❌ [UnreadMessages] Failed: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        {
          error: 'Failed to fetch unread messages',
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      );
    }

    const unreadData = await response.json();
    console.log(
      `✅ [UnreadMessages] Found ${unreadData.results?.length || 0} conversations with unread messages`
    );

    // Obtener detalles de cada conversación con mensajes
    const conversationsWithMessages = [];

    if (unreadData.results && unreadData.results.length > 0) {
      for (const result of unreadData.results) {
        try {
          const resourcePath = result.resource;
          const messageCount = result.count;

          console.log(
            `🔍 [UnreadMessages] Getting details for ${resourcePath} (${messageCount} unread)`
          );

          // El resource viene en formato "/packs/123456789"
          if (resourcePath.includes('/packs/')) {
            const packId = resourcePath.split('/packs/')[1];

            // Obtener detalles de los mensajes
            const messagesUrl = `https://api.mercadolibre.com/messages${resourcePath}?tag=post_sale&mark_as_read=false`;
            const messagesResponse = await authenticatedFetch(messagesUrl, {
              method: 'GET'
            });

            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();

              conversationsWithMessages.push({
                pack_id: packId,
                unread_count: messageCount,
                conversation_status: messagesData.conversation_status,
                messages: messagesData.messages || [],
                resource_path: resourcePath
              });

              console.log(
                `✅ [UnreadMessages] Pack ${packId}: ${messagesData.messages?.length || 0} messages loaded`
              );
            } else {
              console.warn(
                `⚠️ [UnreadMessages] Failed to get messages for ${resourcePath}: ${messagesResponse.status}`
              );
            }
          }
        } catch (error) {
          console.error(
            `❌ [UnreadMessages] Error processing ${result.resource}:`,
            error
          );
        }
      }
    }

    const result = {
      success: true,
      total_conversations: unreadData.results?.length || 0,
      user_id: unreadData.userId || unreadData.user_id,
      conversations: conversationsWithMessages,
      raw_unread_data: unreadData
    };

    console.log(
      `✅ [UnreadMessages] Successfully processed ${conversationsWithMessages.length} conversations`
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [UnreadMessages] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch unread messages',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
