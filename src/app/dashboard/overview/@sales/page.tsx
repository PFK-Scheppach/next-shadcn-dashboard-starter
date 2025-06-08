import { delay } from '@/constants/mock-api';
import {
  RecentSales,
  type RecentSale
} from '@/features/overview/components/recent-sales';
import {
  getWooOrders,
  type WooOrder
} from '@/features/woocommerce/actions/get-orders';
import { fetchOrders, type MercadoLibreOrder } from '@/lib/mercadolibre';

// Helper to generate initials for avatars
function getInitials(name: string): string {
  const parts = name.split(' ').filter((part) => part.length > 0);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function Sales() {
  // Optional delay to simulate loading
  // await delay(3000);

  // Fetch orders from both sources concurrently
  const [wooOrders, mlOrders] = await Promise.all([
    getWooOrders(),
    fetchOrders()
  ]);

  // Map WooCommerce orders to RecentSale format
  const wooSales: RecentSale[] = wooOrders.map((order: WooOrder) => ({
    name: `${order.billing.first_name} ${order.billing.last_name}`,
    email: order.billing.email,
    amount: `+$${order.total}`,
    fallback: getInitials(
      `${order.billing.first_name} ${order.billing.last_name}`
    )
  }));

  // Map Mercado Libre orders to RecentSale format
  const mlSales: RecentSale[] = mlOrders.map((order: MercadoLibreOrder) => ({
    name: order.buyer.nickname,
    // email is not readily available in this ML order structure
    amount: `+$${order.total_amount}`,
    fallback: getInitials(order.buyer.nickname)
  }));

  // Combine and potentially sort sales (optional, currently just concatenating)
  const combinedSales: RecentSale[] = [...wooSales, ...mlSales];

  // Sort by date if possible, or another relevant field. Current data structures
  // make direct date sorting across both sources tricky without more info.
  // For now, we'll just show them combined.

  return <RecentSales sales={combinedSales} />;
}
