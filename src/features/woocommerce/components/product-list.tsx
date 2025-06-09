import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import type { WooProduct } from '../actions/get-products';

export default function ProductList({ products }: { products: WooProduct[] }) {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>WooCommerce Products</CardTitle>
        <CardDescription>You have {products.length} products.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {products.map((product) => (
            <div key={product.id} className='flex items-center justify-between'>
              <span className='text-sm'>{product.name}</span>
              <span className='font-medium'>{product.stock_quantity ?? 0}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
