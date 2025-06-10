import { tokenManager } from './mercadolibre-token-manager';

// Initialize token manager
tokenManager.getValidToken().catch(console.error);

export interface MercadoLibreOrder {
  id: number;
  date_created: string;
  total_amount: number;
  buyer: {
    id: number;
    nickname: string;
  };
  pack_id?: number;
  status?: string;
  shipping?: {
    tracking_number?: string;
    status?: string;
    id?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface MercadoLibreMessage {
  id: string;
  text: string | { plain: string };
  from: {
    user_id: string;
  };
  to: {
    user_id: string;
  };
  message_date: {
    created: string;
    received: string;
    available: string;
    notified: string;
    read?: string;
  };
  status: string;
  message_moderation: {
    status: string;
    reason?: string;
    source: string;
    moderation_date: string;
  };
}

export interface MercadoLibreThread {
  id: string;
  pack_id: number;
  other_user: {
    id: string;
    nickname: string;
  };
  last_message: MercadoLibreMessage;
}

export interface MercadoLibreQuestion {
  id: number;
  text: string;
  status: string;
  date_created: string;
  from: {
    id: string;
    nickname: string;
  };
  answer?: {
    text: string;
    date_created: string;
  };
  item_id: string;
}

let currentToken: string | undefined = process.env.MERCADOLIBRE_ACCESS_TOKEN;

// Rate limiting utility
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let lastApiCall = 0;
const MIN_INTERVAL_BETWEEN_CALLS = 200; // 200ms between calls to respect rate limits

async function throttledApiCall(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;

  if (timeSinceLastCall < MIN_INTERVAL_BETWEEN_CALLS) {
    await sleep(MIN_INTERVAL_BETWEEN_CALLS - timeSinceLastCall);
  }

  lastApiCall = Date.now();

  // Usar el token manager para obtener un token válido
  const token = await tokenManager.getValidToken();

  const optionsWithToken = {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`
    }
  };

  try {
    const response = await fetch(url, optionsWithToken);

    // Si obtenemos 401, es posible que el token haya expirado,
    // pero el token manager debería manejarlo automáticamente
    if (response.status === 401) {
      console.log('⚠️ [API] Token inválido detectado, reintentando...');

      // Forzar renovación y reintentar una vez
      const newToken = await tokenManager.getValidToken();
      const retryOptions = {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${newToken}`
        }
      };

      return await fetch(url, retryOptions);
    }

    return response;
  } catch (error) {
    console.error('Error in throttledApiCall:', error);
    throw error;
  }
}

// Date utility functions
export function getCurrentDate() {
  return new Date();
}

export function getCurrentMonthRange() {
  const now = getCurrentDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0, 23, 59, 59);

  return {
    from: firstDay.toISOString(),
    to: lastDay.toISOString(),
    monthName: now.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    })
  };
}

export function getDateRange(fromDate: Date, toDate: Date) {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);

  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString()
  };
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = process.env.MERCADOLIBRE_REFRESH_TOKEN;
  const clientId = process.env.MERCADOLIBRE_CLIENT_ID;
  const clientSecret = process.env.MERCADOLIBRE_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    console.warn('MercadoLibre refresh credentials not provided');
    return null;
  }

  try {
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
      console.error('Failed to refresh MercadoLibre token', await res.text());
      return null;
    }

    const data: { access_token: string } = await res.json();
    currentToken = data.access_token;
    return currentToken;
  } catch (error) {
    console.error('Error refreshing MercadoLibre token:', error);
    return null;
  }
}

async function fetchShipmentDetails(
  shipmentId: string
): Promise<{ status?: string; tracking_number?: string } | null> {
  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
  }

  const url = `https://api.mercadolibre.com/shipments/${shipmentId}`;
  try {
    const res = await throttledApiCall(url, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return null;

      const retryRes = await throttledApiCall(url, {
        headers: {
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!retryRes.ok) {
        console.error(
          'Failed to fetch MercadoLibre shipment after token refresh',
          await retryRes.text()
        );
        return null;
      }

      return (await retryRes.json()) as {
        status?: string;
        tracking_number?: string;
      };
    }

    if (!res.ok) {
      console.error('Failed to fetch MercadoLibre shipment', await res.text());
      return null;
    }

    return (await res.json()) as {
      status?: string;
      tracking_number?: string;
    };
  } catch (error) {
    console.error('Error fetching MercadoLibre shipment:', error);
    return null;
  }
}

async function attachShippingInfo(order: MercadoLibreOrder) {
  const id = order.shipping?.id as number | undefined;
  if (!id) return order;
  const details = await fetchShipmentDetails(String(id));
  if (details) {
    order.shipping = {
      ...order.shipping,
      status: details.status,
      tracking_number: details.tracking_number
    };
  }
  return order;
}

// Default function - only current month orders to avoid API overload
export async function fetchOrders(): Promise<MercadoLibreOrder[]> {
  const currentMonth = getCurrentMonthRange();
  console.log(`Fetching orders for current month: ${currentMonth.monthName}`);
  return fetchOrdersByDateRange(currentMonth.from, currentMonth.to);
}

// Flexible function for custom date ranges
export async function fetchOrdersByDateRange(
  fromDate?: string,
  toDate?: string
): Promise<MercadoLibreOrder[]> {
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!sellerId) {
    console.warn('MercadoLibre seller id not provided');
    return [];
  }

  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.warn('No MercadoLibre token available');
      return [];
    }
  }

  const baseUrl =
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}` +
    `&order.status=paid` +
    (fromDate ? `&order.date_created.from=${fromDate}` : '') +
    (toDate ? `&order.date_created.to=${toDate}` : '');

  const allOrders: MercadoLibreOrder[] = [];
  let offset = 0;
  const limit = 50;

  try {
    while (true) {
      const url = `${baseUrl}&offset=${offset}&limit=${limit}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) return allOrders;

        const retryRes = await fetch(url, {
          headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!retryRes.ok) {
          console.error(
            'Failed to fetch MercadoLibre orders after token refresh',
            await retryRes.text()
          );
          return allOrders;
        }

        const data = await retryRes.json();
        const processed = await Promise.all(
          (data.results as MercadoLibreOrder[]).map(attachShippingInfo)
        );
        allOrders.push(...processed);
        if (data.results.length < limit) break;
      } else {
        if (!res.ok) {
          console.error(
            'Failed to fetch MercadoLibre orders',
            await res.text()
          );
          return allOrders;
        }

        const data = await res.json();
        const processed = await Promise.all(
          (data.results as MercadoLibreOrder[]).map(attachShippingInfo)
        );
        allOrders.push(...processed);
        if (data.results.length < limit) break;
      }

      offset += limit;
      await sleep(200); // small delay to respect rate limits
    }

    console.log(`Found ${allOrders.length} orders in date range`);
    return allOrders;
  } catch (error) {
    console.error('Error fetching MercadoLibre orders:', error);
    return allOrders;
  }
}

export async function fetchMessageThreadsByDateRange(
  fromDate?: Date,
  toDate?: Date
): Promise<
  Array<{
    pack_id: number;
    buyer: { id: string; nickname: string };
    messages: MercadoLibreMessage[];
  }>
> {
  console.log(
    '🔄 [MercadoLibre Messages] Using pack-based approach (official API)'
  );

  // First get orders for the specified date range to find pack IDs and buyer info
  const orders = await fetchOrdersByDateRange(
    fromDate?.toISOString().split('T')[0],
    toDate?.toISOString().split('T')[0]
  );

  if (orders.length === 0) {
    console.log('No orders found for the specified date range');
    return [];
  }

  // Group orders by pack_id and extract buyer information
  const packMap = new Map<
    number,
    { buyer: { id: string; nickname: string } }
  >();

  for (const order of orders) {
    if (order.pack_id && order.buyer) {
      packMap.set(order.pack_id, {
        buyer: {
          id: order.buyer.id.toString(),
          nickname: order.buyer.nickname || 'Cliente'
        }
      });
    }
  }

  const packIds = Array.from(packMap.keys());
  const dateRangeStr =
    fromDate && toDate
      ? `from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`
      : 'current month';

  console.log(
    `📦 Found ${packIds.length} packs to check for messages (${dateRangeStr})`
  );

  const messageThreads: Array<{
    pack_id: number;
    buyer: { id: string; nickname: string };
    messages: MercadoLibreMessage[];
  }> = [];

  // Fetch messages for each pack with throttling
  for (const packId of packIds) {
    try {
      const packMessages = await fetchAllMessagesForPack(packId);
      if (packMessages.length > 0) {
        const packInfo = packMap.get(packId)!;
        messageThreads.push({
          pack_id: packId,
          buyer: packInfo.buyer,
          messages: packMessages
        });
        console.log(
          `💬 Found ${packMessages.length} messages for pack ${packId} (buyer: ${packInfo.buyer.nickname})`
        );
      }

      // Respect rate limits
      await sleep(300);
    } catch (error) {
      console.log(`⚠️ Skipping pack ${packId} due to error:`, error);
      continue;
    }
  }

  console.log(`✅ Total message threads found: ${messageThreads.length}`);
  return messageThreads;
}

export async function sendBuyerMessage(
  packId: number,
  text: string,
  buyerUserId: string
): Promise<boolean> {
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!sellerId || !text.trim()) {
    console.warn('MercadoLibre seller id or message text not provided');
    return false;
  }

  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return false;
  }

  try {
    console.log(
      `📤 [MercadoLibre Messages] Sending message to pack ${packId}, buyer ${buyerUserId}`
    );

    // Use the exact format from the official documentation
    const res = await fetch(
      `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: {
            user_id: sellerId
          },
          to: {
            user_id: buyerUserId
          },
          text: text.trim() // Plain text as per documentation
        })
      }
    );

    if (res.status === 401) {
      console.log('🔄 [MercadoLibre Messages] Token expired, refreshing...');
      const newToken = await refreshAccessToken();
      if (!newToken) return false;

      const retryRes = await fetch(
        `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: {
              user_id: sellerId
            },
            to: {
              user_id: buyerUserId
            },
            text: text.trim()
          })
        }
      );

      if (!retryRes.ok) {
        const errorText = await retryRes.text();
        console.error(
          '❌ [MercadoLibre Messages] Failed to send message after token refresh',
          errorText
        );
        return false;
      }

      console.log(
        '✅ [MercadoLibre Messages] Message sent successfully after token refresh'
      );
      return true;
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        '❌ [MercadoLibre Messages] Failed to send message',
        errorText
      );
      return false;
    }

    console.log('✅ [MercadoLibre Messages] Message sent successfully');
    return true;
  } catch (error) {
    console.error('❌ [MercadoLibre Messages] Error sending message:', error);
    return false;
  }
}

export async function fetchMessagesForPack(
  packId: number,
  limit = 50,
  offset = 0
): Promise<MercadoLibreMessage[]> {
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!sellerId) {
    console.warn('MercadoLibre seller id not provided');
    return [];
  }

  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.warn('No MercadoLibre token available');
      return [];
    }
  }

  try {
    // Use the correct messages endpoint for packs
    const res = await throttledApiCall(
      `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?mark_as_read=false&limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return [];

      const retryRes = await throttledApiCall(
        `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?mark_as_read=false&limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!retryRes.ok) {
        if (retryRes.status === 404) {
          // Pack doesn't have messages, this is normal
          return [];
        }
        const errorData = await retryRes.json().catch(() => null);
        if (errorData?.error === 'resource not found') {
          // Pack doesn't have messages or is not accessible for messaging
          return [];
        }
        console.error(
          'Failed to fetch MercadoLibre messages for pack after token refresh',
          await retryRes.text()
        );
        return [];
      }

      const data = await retryRes.json();
      const msgs: MercadoLibreMessage[] = data.messages || [];
      return msgs.map((m) =>
        typeof m.text === 'object' && 'plain' in m.text
          ? { ...m, text: (m.text as any).plain }
          : m
      );
    }

    if (!res.ok) {
      if (res.status === 404) {
        // Pack doesn't have messages, this is normal
        return [];
      }
      const errorData = await res.json().catch(() => null);
      if (errorData?.error === 'resource not found') {
        // Pack doesn't have messages or is not accessible for messaging
        return [];
      }
      console.error(
        'Failed to fetch MercadoLibre messages for pack',
        await res.text()
      );
      return [];
    }

    const data = await res.json();
    const msgs: MercadoLibreMessage[] = data.messages || [];
    return msgs.map((m) =>
      typeof m.text === 'object' && 'plain' in m.text
        ? { ...m, text: (m.text as any).plain }
        : m
    );
  } catch (error) {
    console.error('Error fetching MercadoLibre messages for pack:', error);
    return [];
  }
}

export async function fetchAllMessagesForPack(
  packId: number
): Promise<MercadoLibreMessage[]> {
  const limit = 50;
  let offset = 0;
  const all: MercadoLibreMessage[] = [];

  while (true) {
    const batch = await fetchMessagesForPack(packId, limit, offset);
    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
    await sleep(200);
  }

  return all;
}

// Generic function to fetch all messages by getting packs first, then messages for each pack
export async function fetchMessages(): Promise<MercadoLibreMessage[]> {
  // Use current month by default to avoid API saturation
  const currentMonthRange = getCurrentMonthRange();
  console.log(
    `🗓️ Fetching messages for current month: ${currentMonthRange.monthName}`
  );
  return fetchMessagesByDateRange(
    new Date(currentMonthRange.from),
    new Date(currentMonthRange.to)
  );
}

export async function fetchMessagesByDateRange(
  fromDate?: Date,
  toDate?: Date
): Promise<MercadoLibreMessage[]> {
  // First get orders for the specified date range to find pack IDs
  const orders = await fetchOrdersByDateRange(
    fromDate?.toISOString().split('T')[0],
    toDate?.toISOString().split('T')[0]
  );
  if (orders.length === 0) {
    console.log('No orders found for the specified date range');
    return [];
  }

  const allMessages: MercadoLibreMessage[] = [];

  // Get unique pack IDs from orders, filtering out null values, and only get recent ones
  const packIds = Array.from(
    new Set(
      orders
        .filter(
          (order) => order.pack_id !== null && order.pack_id !== undefined
        )
        .map((order) => order.pack_id!)
    )
  );

  const dateRangeStr =
    fromDate && toDate
      ? `from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`
      : 'all time';
  console.log(
    `Fetching messages for ${packIds.length} packs (${dateRangeStr}):`,
    packIds
  );

  // Fetch messages for each pack with throttling
  for (const packId of packIds) {
    try {
      const packMessages = await fetchAllMessagesForPack(packId);
      if (packMessages.length > 0) {
        allMessages.push(...packMessages);
        console.log(`Found ${packMessages.length} messages for pack ${packId}`);
      }

      // Add delay between pack requests to respect rate limits
      await sleep(300);
    } catch (error) {
      console.log(`Skipping pack ${packId} due to error`);
      continue;
    }
  }

  console.log(`Total messages fetched: ${allMessages.length}`);
  return allMessages;
}

export async function fetchUserItems(): Promise<string[]> {
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!sellerId) {
    console.warn('MercadoLibre seller id not provided');
    return [];
  }

  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.warn('No MercadoLibre token available');
      return [];
    }
  }

  try {
    const res = await fetch(
      `https://api.mercadolibre.com/users/${sellerId}/items/search`,
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return [];

      const retryRes = await fetch(
        `https://api.mercadolibre.com/users/${sellerId}/items/search`,
        {
          headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!retryRes.ok) {
        console.error(
          'Failed to fetch user items after token refresh',
          await retryRes.text()
        );
        return [];
      }

      const data = await retryRes.json();
      return data.results || [];
    }

    if (!res.ok) {
      console.error('Failed to fetch user items', await res.text());
      return [];
    }

    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching user items:', error);
    return [];
  }
}

export async function fetchQuestions(): Promise<MercadoLibreQuestion[]> {
  // Use current month by default to avoid API saturation
  const currentMonthRange = getCurrentMonthRange();
  console.log(
    `🗓️ Fetching questions for current month: ${currentMonthRange.monthName}`
  );
  return fetchQuestionsByDateRange(
    new Date(currentMonthRange.from),
    new Date(currentMonthRange.to)
  );
}

export async function fetchQuestionsByDateRange(
  fromDate?: Date,
  toDate?: Date
): Promise<MercadoLibreQuestion[]> {
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!sellerId) {
    console.warn('MercadoLibre seller id not provided');
    return [];
  }

  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.warn('No MercadoLibre token available');
      return [];
    }
  }

  try {
    // First get user's items to query questions for them
    const itemIds = await fetchUserItems();
    if (itemIds.length === 0) return [];

    const allQuestions: MercadoLibreQuestion[] = [];

    // Fetch questions for each item (limit to recent items to avoid rate limits)
    const limitedItems = itemIds.slice(0, 10); // Reduce from 20 to 10 items

    const dateRangeStr =
      fromDate && toDate
        ? `from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`
        : 'all time';
    console.log(
      `Fetching questions for ${limitedItems.length} items (${dateRangeStr})`
    );

    for (const itemId of limitedItems) {
      try {
        const res = await throttledApiCall(
          `https://api.mercadolibre.com/questions/search?item_id=${itemId}`,
          {
            headers: {
              Authorization: `Bearer ${currentToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (res.status === 401) {
          const newToken = await refreshAccessToken();
          if (!newToken) continue;

          const retryRes = await throttledApiCall(
            `https://api.mercadolibre.com/questions/search?item_id=${itemId}`,
            {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (retryRes.ok) {
            const data = await retryRes.json();
            if (data.questions && data.questions.length > 0) {
              const questionsWithItem = data.questions.map((q: any) => ({
                ...q,
                item_id: itemId
              }));

              // Filter by date range if provided
              const filteredQuestions =
                fromDate && toDate
                  ? questionsWithItem.filter((q: any) => {
                      const questionDate = new Date(q.date_created);
                      return questionDate >= fromDate && questionDate <= toDate;
                    })
                  : questionsWithItem;

              allQuestions.push(...filteredQuestions);
              console.log(
                `Found ${filteredQuestions.length} questions for item ${itemId}`
              );
            }
          }
        } else if (res.ok) {
          const data = await res.json();
          if (data.questions && data.questions.length > 0) {
            const questionsWithItem = data.questions.map((q: any) => ({
              ...q,
              item_id: itemId
            }));

            // Filter by date range if provided
            const filteredQuestions =
              fromDate && toDate
                ? questionsWithItem.filter((q: any) => {
                    const questionDate = new Date(q.date_created);
                    return questionDate >= fromDate && questionDate <= toDate;
                  })
                : questionsWithItem;

            allQuestions.push(...filteredQuestions);
            console.log(
              `Found ${filteredQuestions.length} questions for item ${itemId}`
            );
          }
        }
      } catch (error) {
        console.error(`Error fetching questions for item ${itemId}:`, error);
      }
    }

    console.log(`Total questions fetched: ${allQuestions.length}`);
    return allQuestions;
  } catch (error) {
    console.error('Error fetching MercadoLibre questions:', error);
    return [];
  }
}

export async function answerQuestion(
  questionId: number,
  text: string
): Promise<boolean> {
  if (!text.trim()) {
    console.warn('Answer text not provided');
    return false;
  }

  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return false;
  }

  try {
    const res = await fetch(`https://api.mercadolibre.com/answers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question_id: questionId,
        text: text.trim()
      })
    });

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return false;

      const retryRes = await fetch(`https://api.mercadolibre.com/answers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: questionId,
          text: text.trim()
        })
      });

      if (!retryRes.ok) {
        console.error(
          'Failed to answer MercadoLibre question after token refresh',
          await retryRes.text()
        );
        return false;
      }

      return true;
    }

    if (!res.ok) {
      console.error('Failed to answer MercadoLibre question', await res.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error answering MercadoLibre question:', error);
    return false;
  }
}

export async function fetchOrderDetails(
  orderId: string
): Promise<MercadoLibreOrder | null> {
  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.warn('No MercadoLibre token available');
      return null;
    }
  }

  try {
    const res = await throttledApiCall(
      `https://api.mercadolibre.com/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return null;

      const retryRes = await throttledApiCall(
        `https://api.mercadolibre.com/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!retryRes.ok) {
        console.error(
          'Failed to fetch order details after token refresh',
          await retryRes.text()
        );
        return null;
      }

      const order = (await retryRes.json()) as MercadoLibreOrder;
      return await attachShippingInfo(order);
    }

    if (!res.ok) {
      console.error('Failed to fetch order details', await res.text());
      return null;
    }

    const order = (await res.json()) as MercadoLibreOrder;
    return await attachShippingInfo(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
}
