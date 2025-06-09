'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { MercadoLibreOrder } from '@/lib/mercadolibre';

interface MercadoLibreSalesAnalyticsProps {
  orders: MercadoLibreOrder[];
}

export function MercadoLibreSalesAnalytics({
  orders
}: MercadoLibreSalesAnalyticsProps) {
  // Calculate analytics data
  const totalSales = orders.reduce(
    (total, order) => total + order.total_amount,
    0
  );

  // Group orders by month
  const monthlyData = orders.reduce(
    (acc, order) => {
      const date = new Date(order.date_created);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[monthKey]) {
        acc[monthKey] = { orders: 0, sales: 0, month: monthKey };
      }

      acc[monthKey].orders += 1;
      acc[monthKey].sales += order.total_amount;

      return acc;
    },
    {} as Record<string, { orders: number; sales: number; month: string }>
  );

  const monthlyStats = Object.values(monthlyData)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6);

  // Top buyers analysis
  const buyerStats = orders.reduce(
    (acc, order) => {
      const buyer = order.buyer.nickname;
      if (!acc[buyer]) {
        acc[buyer] = { orders: 0, totalSpent: 0 };
      }
      acc[buyer].orders += 1;
      acc[buyer].totalSpent += order.total_amount;
      return acc;
    },
    {} as Record<string, { orders: number; totalSpent: number }>
  );

  const topBuyers = Object.entries(buyerStats)
    .map(([nickname, stats]) => ({ nickname, ...stats }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' });
  };

  return (
    <>
      {/* Monthly Performance */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CalendarDays className='h-5 w-5' />
            Rendimiento Mensual
          </CardTitle>
          <CardDescription>
            Ventas y órdenes por mes (últimos 6 meses)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {monthlyStats.length === 0 ? (
              <p className='text-muted-foreground py-4 text-center text-sm'>
                No hay datos suficientes para mostrar estadísticas mensuales
              </p>
            ) : (
              monthlyStats.map((month) => (
                <div
                  key={month.month}
                  className='flex items-center justify-between rounded-lg border p-3'
                >
                  <div>
                    <p className='font-medium'>{formatMonth(month.month)}</p>
                    <p className='text-muted-foreground text-sm'>
                      {month.orders} orden{month.orders !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold text-green-600'>
                      {formatCurrency(month.sales)}
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      {formatCurrency(month.sales / month.orders)} promedio
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Buyers */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Mejores Compradores
          </CardTitle>
          <CardDescription>
            Compradores con mayor volumen de compras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {topBuyers.length === 0 ? (
              <p className='text-muted-foreground py-4 text-center text-sm'>
                No hay suficientes datos de compradores
              </p>
            ) : (
              topBuyers.map((buyer, index) => (
                <div
                  key={buyer.nickname}
                  className='flex items-center justify-between rounded-lg border p-3'
                >
                  <div className='flex items-center gap-3'>
                    <Badge
                      variant='outline'
                      className='flex h-8 w-8 items-center justify-center rounded-full'
                    >
                      {index + 1}
                    </Badge>
                    <div>
                      <p className='font-medium'>{buyer.nickname}</p>
                      <p className='text-muted-foreground text-sm'>
                        {buyer.orders} compra{buyer.orders !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold text-green-600'>
                      {formatCurrency(buyer.totalSpent)}
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      {formatCurrency(buyer.totalSpent / buyer.orders)} promedio
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Trends */}
      <Card className='md:col-span-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            Tendencias de Ventas
          </CardTitle>
          <CardDescription>
            Análisis general del rendimiento de ventas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='rounded-lg border p-4 text-center'>
              <ShoppingBag className='mx-auto mb-2 h-8 w-8 text-blue-600' />
              <p className='text-2xl font-bold'>{orders.length}</p>
              <p className='text-muted-foreground text-sm'>Total Órdenes</p>
            </div>

            <div className='rounded-lg border p-4 text-center'>
              <TrendingUp className='mx-auto mb-2 h-8 w-8 text-green-600' />
              <p className='text-2xl font-bold'>{formatCurrency(totalSales)}</p>
              <p className='text-muted-foreground text-sm'>Ventas Totales</p>
            </div>

            <div className='rounded-lg border p-4 text-center'>
              <Users className='mx-auto mb-2 h-8 w-8 text-purple-600' />
              <p className='text-2xl font-bold'>
                {Object.keys(buyerStats).length}
              </p>
              <p className='text-muted-foreground text-sm'>
                Compradores Únicos
              </p>
            </div>
          </div>

          {orders.length > 0 && (
            <div className='bg-muted/50 mt-6 rounded-lg p-4'>
              <h4 className='mb-2 font-medium'>Insights</h4>
              <ul className='text-muted-foreground space-y-1 text-sm'>
                <li>
                  • Valor promedio por orden:{' '}
                  {formatCurrency(totalSales / orders.length)}
                </li>
                <li>
                  • Órdenes por comprador:{' '}
                  {(orders.length / Object.keys(buyerStats).length).toFixed(1)}{' '}
                  promedio
                </li>
                {monthlyStats.length > 1 && (
                  <li>
                    • Tendencia mensual:{' '}
                    {monthlyStats[0].sales > monthlyStats[1].sales
                      ? 'Creciente ↗'
                      : 'Decreciente ↘'}
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
