export interface WooOrder {
  id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
  total: string;
}

export async function getWooOrders(): Promise<WooOrder[]> {
  const base = process.env.WOOCOMMERCE_API_URL;
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!base || !key || !secret) {
    console.error('Missing WooCommerce environment variables');
    return [];
  }

  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await fetch(
    `${base.replace(/\/$/, '')}/wp-json/wc/v3/orders?per_page=5&orderby=date&order=desc`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!res.ok) {
    console.error('Failed to fetch orders from WooCommerce', await res.text());
    return [];
  }

  return res.json();
}
