import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import ProductList from '@/features/woocommerce/components/product-list';
import { getWooProducts } from '@/features/woocommerce/actions/get-products';

export const metadata = {
  title: 'Dashboard: WooCommerce Products'
};

export default async function WooProductsPage() {
  const products = await getWooProducts();
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='WooCommerce Products'
          description='Products and stock from your WooCommerce store'
        />
        <ProductList products={products} />
      </div>
    </PageContainer>
  );
}
