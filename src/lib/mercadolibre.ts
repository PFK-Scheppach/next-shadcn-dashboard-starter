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
