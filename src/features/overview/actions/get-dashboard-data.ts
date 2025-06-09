import { getWooOrders } from '@/features/woocommerce/actions/get-orders';
import { fetchOrders as fetchMlOrders } from '@/lib/mercadolibre';

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  newCustomers: number;
}

export interface BarDataEntry {
  date: string;
  woocommerce: number;
  mercadolibre: number;
}

export interface AreaDataEntry {
  month: string;
  woocommerce: number;
  mercadolibre: number;
}

export interface PieDataEntry {
  platform: string;
  orders: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  barData: BarDataEntry[];
  areaData: AreaDataEntry[];
  pieData: PieDataEntry[];
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatMonth(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export async function getDashboardData(): Promise<DashboardData> {
  const [wooOrders, mlOrders] = await Promise.all([
    getWooOrders({ perPage: 100 }),
    fetchMlOrders()
  ]);

  const wooRevenue = wooOrders.reduce(
    (acc, o) => acc + parseFloat(o.total || '0'),
    0
  );
  const mlRevenue = mlOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const totalRevenue = wooRevenue + mlRevenue;
  const totalOrders = wooOrders.length + mlOrders.length;

  const customerSet = new Set<string>();
  wooOrders.forEach((o) => customerSet.add(o.billing.email.toLowerCase()));
  mlOrders.forEach((o) => customerSet.add(o.buyer.nickname));
  const newCustomers = customerSet.size;

  // Bar data: last 30 days order counts by platform
  const barDataMap: Record<string, { woo: number; ml: number }> = {};
  const today = startOfDay(new Date());
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    barDataMap[formatDate(d)] = { woo: 0, ml: 0 };
  }
  wooOrders.forEach((o) => {
    const key = formatDate(startOfDay(new Date(o.date_created)));
    if (barDataMap[key]) barDataMap[key].woo += 1;
  });
  mlOrders.forEach((o) => {
    const key = formatDate(startOfDay(new Date(o.date_created)));
    if (barDataMap[key]) barDataMap[key].ml += 1;
  });
  const barData = Object.entries(barDataMap).map(([date, v]) => ({
    date,
    woocommerce: v.woo,
    mercadolibre: v.ml
  }));

  // Area data: last 6 months revenue by platform
  const areaMap: Record<string, { woo: number; ml: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    areaMap[formatMonth(d)] = { woo: 0, ml: 0 };
  }
  wooOrders.forEach((o) => {
    const d = new Date(o.date_created);
    const key = formatMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    if (areaMap[key]) areaMap[key].woo += parseFloat(o.total || '0');
  });
  mlOrders.forEach((o) => {
    const d = new Date(o.date_created);
    const key = formatMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    if (areaMap[key]) areaMap[key].ml += o.total_amount || 0;
  });
  const areaData = Object.entries(areaMap).map(([month, v]) => ({
    month,
    woocommerce: v.woo,
    mercadolibre: v.ml
  }));

  const pieData: PieDataEntry[] = [
    { platform: 'WooCommerce', orders: wooOrders.length },
    { platform: 'MercadoLibre', orders: mlOrders.length }
  ];

  return {
    metrics: { totalRevenue, totalOrders, newCustomers },
    barData,
    areaData,
    pieData
  };
}
