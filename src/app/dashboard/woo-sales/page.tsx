import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import OrderList from '@/features/woocommerce/components/order-list';
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
          description='Latest orders from your WooCommerce store'
        />
        <OrderList orders={orders} />
      </div>
    </PageContainer>
  );
}
