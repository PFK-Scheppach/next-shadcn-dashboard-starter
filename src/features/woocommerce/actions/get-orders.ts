export interface WooOrder {
  id: number;
  date_created: string;
  status: string;
  currency: string;
  total: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    address_1?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    price: string;
    total: string;
  }>;
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
