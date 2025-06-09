import { BarGraph } from '@/features/overview/components/bar-graph';
import { getDashboardData } from '@/features/overview/actions/get-dashboard-data';

export default async function BarStats() {
  const data = await getDashboardData();

  return <BarGraph data={data.barData} />;
}
