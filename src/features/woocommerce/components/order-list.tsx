import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import type { WooOrder } from '../actions/get-orders';

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default function OrderList({ orders }: { orders: WooOrder[] }) {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent WooCommerce Sales</CardTitle>
        <CardDescription>
          You have {orders.length} recent orders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {orders.map((order) => (
            <div key={order.id} className='flex items-center'>
              <Avatar className='h-9 w-9'>
                <AvatarImage
                  src={`https://avatars.dicebear.com/api/initials/${order.billing.first_name}%20${order.billing.last_name}.svg`}
                  alt='Avatar'
                />
                <AvatarFallback>
                  {initials(order.billing.first_name, order.billing.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className='ml-4 space-y-1'>
                <p className='text-sm leading-none font-medium'>
                  {order.billing.first_name} {order.billing.last_name}
                </p>
                <p className='text-muted-foreground text-sm'>
                  {order.billing.email}
                </p>
              </div>
              <div className='ml-auto font-medium'>${order.total}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
