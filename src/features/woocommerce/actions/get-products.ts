export interface WooProduct {
  id: number;
  name: string;
  stock_quantity: number | null;
}

export async function getWooProducts(): Promise<WooProduct[]> {
  const base = process.env.WOOCOMMERCE_API_URL;
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!base || !key || !secret) {
    console.error('Missing WooCommerce environment variables');
    return [];
  }

  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await fetch(
    `${base.replace(/\/$/, '')}/wp-json/wc/v3/products?per_page=100`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!res.ok) {
    console.error(
      'Failed to fetch products from WooCommerce',
      await res.text()
    );
    return [];
  }

  return res.json();
}
