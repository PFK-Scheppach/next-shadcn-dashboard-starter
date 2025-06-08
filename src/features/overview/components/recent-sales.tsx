import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

export interface RecentSale {
  name: string;
  email?: string;
  avatar?: string;
  fallback: string;
  amount: string;
}

export function RecentSales({ sales }: { sales: RecentSale[] }) {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>
          You made {sales.length} sales this month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {sales.map((sale, index) => (
            <div key={index} className='flex items-center'>
              <Avatar className='h-9 w-9'>
                {sale.avatar ? (
                  <AvatarImage src={sale.avatar} alt='Avatar' />
                ) : null}
                <AvatarFallback>{sale.fallback}</AvatarFallback>
              </Avatar>
              <div className='ml-4 space-y-1'>
                <p className='text-sm leading-none font-medium'>{sale.name}</p>
                {sale.email && (
                  <p className='text-muted-foreground text-sm'>{sale.email}</p>
                )}
              </div>
              <div className='ml-auto font-medium'>{sale.amount}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
