import {
  fetchOrders,
  fetchOrdersByDateRange,
  type MercadoLibreOrder
} from '@/lib/mercadolibre';

export interface MercadoLibreCustomer {
  nickname: string;
  orders: MercadoLibreOrder[];
  orderCount: number;
  totalSpent: number;
  firstPurchase: string;
  lastPurchase: string;
}

function aggregateCustomers(
  orders: MercadoLibreOrder[]
): MercadoLibreCustomer[] {
  const map = new Map<string, MercadoLibreCustomer>();
  for (const order of orders) {
    const key = order.buyer.nickname || 'Cliente';
    if (!map.has(key)) {
      map.set(key, {
        nickname: key,
        orders: [],
        orderCount: 0,
        totalSpent: 0,
        firstPurchase: order.date_created,
        lastPurchase: order.date_created
      });
    }
    const customer = map.get(key)!;
    customer.orders.push(order);
    customer.orderCount += 1;
    customer.totalSpent += order.total_amount;
    if (new Date(order.date_created) < new Date(customer.firstPurchase)) {
      customer.firstPurchase = order.date_created;
    }
    if (new Date(order.date_created) > new Date(customer.lastPurchase)) {
      customer.lastPurchase = order.date_created;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

export async function getCustomers(): Promise<MercadoLibreCustomer[]> {
  const orders = await fetchOrders();
  return aggregateCustomers(orders);
}

export async function getCustomersByDateRange(
  from?: Date,
  to?: Date
): Promise<MercadoLibreCustomer[]> {
  const fromStr = from ? from.toISOString() : undefined;
  const toStr = to ? to.toISOString() : undefined;
  const orders = await fetchOrdersByDateRange(fromStr, toStr);
  return aggregateCustomers(orders);
}
