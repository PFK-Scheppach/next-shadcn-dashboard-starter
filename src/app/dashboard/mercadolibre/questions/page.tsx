import PageContainer from '@/components/layout/page-container';
import { getMercadoLibreQuestions } from '@/features/mercadolibre/utils/questions';

export const metadata = {
  title: 'Dashboard: MercadoLibre Questions'
};

export default async function Page() {
  const data = await getMercadoLibreQuestions();

  if (!data) {
    return (
      <PageContainer>Failed to load MercadoLibre questions.</PageContainer>
    );
  }

  return (
    <PageContainer>
      <pre className='whitespace-pre-wrap'>{JSON.stringify(data, null, 2)}</pre>
    </PageContainer>
  );
}
