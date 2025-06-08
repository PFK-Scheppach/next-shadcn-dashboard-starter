export interface MercadoLibreOrder {
  id: number;
  date_created: string;
  total_amount: number;
  buyer: {
    nickname: string;
  };
}

export async function fetchOrders(): Promise<MercadoLibreOrder[]> {
  const token = process.env.MERCADOLIBRE_ACCESS_TOKEN;
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!token || !sellerId) {
    console.warn('MercadoLibre credentials not provided');
    return [];
  }

  const url = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error('Failed to fetch MercadoLibre orders', await res.text());
    return [];
  }

  const data = await res.json();
  return data.results as MercadoLibreOrder[];
}
