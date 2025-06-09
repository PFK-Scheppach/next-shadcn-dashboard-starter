import { PieGraph } from '@/features/overview/components/pie-graph';
import { getDashboardData } from '@/features/overview/actions/get-dashboard-data';

export default async function Stats() {
  const data = await getDashboardData();
  return <PieGraph data={data.pieData} />;
}
