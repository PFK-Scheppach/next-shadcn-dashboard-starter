import { delay } from '@/constants/mock-api';
import {
  RecentSales,
  type RecentSale
} from '@/features/overview/components/recent-sales';
import { fetchOrders } from '@/lib/mercadolibre';

export default async function Sales() {
  await delay(3000);
  const orders = await fetchOrders();
  const sales: RecentSale[] = orders.map((o) => ({
    name: o.buyer.nickname,
    fallback: o.buyer.nickname.slice(0, 2).toUpperCase(),
    amount: `+$${o.total_amount}`
  }));
  return <RecentSales sales={sales} />;
}
