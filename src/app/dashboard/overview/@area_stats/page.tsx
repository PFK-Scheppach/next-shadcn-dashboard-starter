import { AreaGraph } from '@/features/overview/components/area-graph';
import { getDashboardData } from '@/features/overview/actions/get-dashboard-data';

export default async function AreaStats() {
  const data = await getDashboardData();
  return <AreaGraph data={data.areaData} />;
}
