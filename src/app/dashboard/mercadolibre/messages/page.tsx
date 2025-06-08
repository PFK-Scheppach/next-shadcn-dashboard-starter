import PageContainer from '@/components/layout/page-container';
import { getMercadoLibreMessages } from '@/features/mercadolibre/utils/messages';
import MessageReplyForm from '@/features/mercadolibre/components/message-reply-form';

export const metadata = {
  title: 'Dashboard: MercadoLibre Messages'
};

export default async function Page() {
  const data = await getMercadoLibreMessages();

  if (!data) {
    return <PageContainer>Failed to load MercadoLibre messages.</PageContainer>;
  }

  return (
    <PageContainer>
      <div className='flex flex-col gap-4'>
        <pre className='whitespace-pre-wrap'>
          {JSON.stringify(data, null, 2)}
        </pre>
        <MessageReplyForm />
      </div>
    </PageContainer>
  );
}
