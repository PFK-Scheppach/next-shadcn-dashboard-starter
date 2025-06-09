import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrderList from '@/features/woocommerce/components/order-list';
import { EmailManager } from '@/features/woocommerce/components/email-manager';
import { getWooOrders } from '@/features/woocommerce/actions/get-orders';

export const metadata = {
  title: 'Dashboard: WooCommerce Sales'
};

export default async function WooSalesPage() {
  const orders = await getWooOrders();
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='WooCommerce Sales'
          description='Gestiona órdenes y emails de tu tienda WooCommerce'
        />

        <Tabs defaultValue='orders' className='w-full'>
          <TabsList>
            <TabsTrigger value='orders'>Órdenes</TabsTrigger>
            <TabsTrigger value='emails'>Gestión de Emails</TabsTrigger>
          </TabsList>

          <TabsContent value='orders' className='space-y-4'>
            <OrderList orders={orders} />
          </TabsContent>

          <TabsContent value='emails' className='space-y-4'>
            <EmailManager orders={orders} />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
