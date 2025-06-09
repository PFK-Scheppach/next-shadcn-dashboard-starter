export interface MercadoLibreOrder {
  id: number;
  date_created: string;
  total_amount: number;
  buyer: {
    nickname: string;
  };
}

let currentToken: string | undefined = process.env.MERCADOLIBRE_ACCESS_TOKEN;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = process.env.MERCADOLIBRE_REFRESH_TOKEN;
  const clientId = process.env.MERCADOLIBRE_CLIENT_ID;
  const clientSecret = process.env.MERCADOLIBRE_CLIENT_SECRET;
  if (!refreshToken || !clientId || !clientSecret) {
    console.warn('MercadoLibre refresh credentials not provided');
    return null;
  }
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
}

export async function fetchOrders(): Promise<MercadoLibreOrder[]> {
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!sellerId) {
    console.warn('MercadoLibre credentials not provided');
    return [];
  }

  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return [];
  }

  let url = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&access_token=${currentToken}`;

  let res = await fetch(url);
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) return [];
    url = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&access_token=${newToken}`;
    res = await fetch(url);
  }
  if (!res.ok) {
    console.error('Failed to fetch MercadoLibre orders', await res.text());
    return [];
  }

  const data = await res.json();
  return data.results as MercadoLibreOrder[];
}

export interface MercadoLibreItem {
  id: string;
  title: string;
  available_quantity: number;
}

export interface MercadoLibreItemStock {
  id: string;
  full: number;
  own: number;
}

function withToken(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}access_token=${currentToken}`;
}

async function fetchWithRefresh(url: string): Promise<Response | null> {
  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
  }

  let res = await fetch(withToken(url));
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) return null;
    res = await fetch(withToken(url));
  }
  if (!res.ok) {
    console.error('MercadoLibre request failed', await res.text());
    return null;
  }
  return res;
}

export async function fetchItems(): Promise<MercadoLibreItem[]> {
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!sellerId) {
    console.warn('MercadoLibre credentials not provided');
    return [];
  }

  const searchUrl = `https://api.mercadolibre.com/users/${sellerId}/items/search?status=active&limit=50`;
  const searchRes = await fetchWithRefresh(searchUrl);
  if (!searchRes) return [];
  const searchData = await searchRes.json();
  const ids: string[] = searchData.results || [];
  const items: MercadoLibreItem[] = [];

  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20);
    const itemsRes = await fetchWithRefresh(
      `https://api.mercadolibre.com/items?ids=${chunk.join(',')}`
    );
    if (!itemsRes) continue;
    const body = await itemsRes.json();
    for (const entry of body) {
      if (entry.body) {
        items.push({
          id: entry.body.id,
          title: entry.body.title,
          available_quantity: entry.body.available_quantity
        });
      }
    }
  }

  return items;
}

export async function fetchItemStock(
  itemId: string
): Promise<MercadoLibreItemStock | null> {
  const stockRes = await fetchWithRefresh(
    `https://api.mercadolibre.com/stock/items/${itemId}`
  );
  if (!stockRes) return null;
  const data = await stockRes.json();

  let full = 0;
  let own = 0;
  if (Array.isArray(data.stock)) {
    for (const s of data.stock) {
      if (s.type === 'fulfillment') full += s.quantity;
      else if (s.type === 'own') own += s.quantity;
    }
  } else if (data.available_quantity) {
    own = data.available_quantity;
  }

  return { id: itemId, full, own };
}
