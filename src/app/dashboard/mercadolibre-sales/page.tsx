'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { EnhancedMercadoLibreOrderList } from '@/features/mercadolibre/components/enhanced-order-list';
import { MercadoLibreSalesAnalytics } from '@/features/mercadolibre/components/sales-analytics';
import { DateRangeFilter } from '@/features/mercadolibre/components/date-range-filter';
import {
  fetchOrders,
  fetchOrdersByDateRange,
  getCurrentMonthRange,
  type MercadoLibreOrder
} from '@/lib/mercadolibre';
import {
  ShoppingCart,
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';

function SalesContent() {
  const [orders, setOrders] = useState<MercadoLibreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDateRange, setCurrentDateRange] = useState<string>('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 [MercadoLibre Sales] Starting to load initial data...');
      const data = await fetchOrders();
      console.log(
        `📦 [MercadoLibre Sales] Loaded ${data.length} orders:`,
        data
      );
      setOrders(data);
      const currentMonth = getCurrentMonthRange();
      console.log(`📅 [MercadoLibre Sales] Current month range:`, currentMonth);
      setCurrentDateRange(currentMonth.monthName);
    } catch (error) {
      console.error('❌ [MercadoLibre Sales] Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = async (
    fromDate?: string,
    toDate?: string,
    label?: string
  ) => {
    setIsLoading(true);
    try {
      console.log(
        `🔄 [MercadoLibre Sales] Filtering by date range: ${fromDate} to ${toDate} (${label})`
      );
      const data = await fetchOrdersByDateRange(fromDate, toDate);
      console.log(
        `📦 [MercadoLibre Sales] Filtered ${data.length} orders:`,
        data
      );
      setOrders(data);
      setCurrentDateRange(label || 'Rango personalizado');
    } catch (error) {
      console.error(
        '❌ [MercadoLibre Sales] Error loading orders for date range:',
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const totalSales = orders.reduce(
    (total, order) => total + order.total_amount,
    0
  );
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyOrders = orders.filter((order) => {
    const orderDate = new Date(order.date_created);
    return (
      orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear
    );
  });
  const monthlySales = monthlyOrders.reduce(
    (total, order) => total + order.total_amount,
    0
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      {/* Current Date Range Badge */}
      <div className='flex items-center justify-between'>
        <Badge variant='outline' className='text-sm'>
          <Calendar className='mr-2 h-4 w-4' />
          Mostrando: {currentDateRange}
        </Badge>
        <Badge variant='secondary'>
          {orders.length} {orders.length === 1 ? 'orden' : 'órdenes'}
        </Badge>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        onDateRangeChange={handleDateRangeChange}
        isLoading={isLoading}
      />

      <Separator />

      {/* Stats Overview */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Ventas Totales
            </CardTitle>
            <TrendingUp className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP'
              }).format(totalSales)}
            </div>
            <p className='text-muted-foreground text-xs'>
              En el período seleccionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Órdenes</CardTitle>
            <ShoppingCart className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{orders.length}</div>
            <p className='text-muted-foreground text-xs'>Total de órdenes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Promedio</CardTitle>
            <Filter className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP'
              }).format(orders.length > 0 ? totalSales / orders.length : 0)}
            </div>
            <p className='text-muted-foreground text-xs'>Por orden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Estado</CardTitle>
            <RefreshCw
              className={`text-muted-foreground h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>Activo</div>
            <p className='text-muted-foreground text-xs'>API funcionando</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Analytics Section */}
      {orders.length > 0 && (
        <>
          <div className='grid gap-4 md:grid-cols-2'>
            <MercadoLibreSalesAnalytics orders={orders} />
          </div>
          <Separator />
        </>
      )}

      {/* Enhanced Orders List */}
      <EnhancedMercadoLibreOrderList orders={orders} />
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Stats Skeleton */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader className='space-y-0 pb-2'>
              <div className='bg-muted h-4 w-24 rounded'></div>
            </CardHeader>
            <CardContent>
              <div className='bg-muted mb-2 h-8 w-32 rounded'></div>
              <div className='bg-muted h-3 w-20 rounded'></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader>
              <div className='bg-muted h-6 w-1/3 rounded'></div>
              <div className='bg-muted h-4 w-1/2 rounded'></div>
            </CardHeader>
            <CardContent>
              <div className='bg-muted h-40 rounded'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function MercadoLibreSalesPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <Heading
          title='Ventas MercadoLibre'
          description='Gestiona y analiza las ventas de tu tienda en MercadoLibre con filtros de fecha'
        />

        <SalesContent />
      </div>
    </PageContainer>
  );
}
