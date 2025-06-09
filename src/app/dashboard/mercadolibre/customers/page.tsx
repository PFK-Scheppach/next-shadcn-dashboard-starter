'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DateRangeFilter } from '@/features/mercadolibre/components/date-range-filter';
import { EnhancedCustomerList } from '@/features/mercadolibre/components/enhanced-customer-list';
import type { MercadoLibreCustomer } from '@/features/mercadolibre/utils/customers';
import { Users, ShoppingCart, DollarSign, Calendar } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<MercadoLibreCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (from?: string, to?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (from && to) {
        params.set('from', from);
        params.set('to', to);
      }
      const res = await fetch(
        `/api/mercadolibre/customers?${params.toString()}`
      );
      const json = await res.json();
      setCustomers(json.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (
    from?: string,
    to?: string,
    label?: string
  ) => {
    setSelectedPeriod(label || 'custom');
    loadCustomers(from, to);
  };

  const totalCustomers = customers.length;
  const totalOrders = customers.reduce((sum, c) => sum + c.orderCount, 0);
  const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <PageContainer>
      <div className='flex-1 space-y-6'>
        <Heading
          title='Clientes MercadoLibre'
          description='Historial y análisis de tus clientes de MercadoLibre'
        />
        <DateRangeFilter
          onDateRangeChange={handleDateRangeChange}
          isLoading={isLoading}
        />
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            {selectedPeriod === 'current-month'
              ? 'Mes actual'
              : selectedPeriod === 'all-time'
                ? 'Todo el tiempo'
                : 'Período personalizado'}
          </Badge>
          <Badge variant='secondary'>
            {totalCustomers} cliente{totalCustomers !== 1 ? 's' : ''}
          </Badge>
        </div>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Clientes</CardTitle>
              <Users className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{totalCustomers}</div>
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
              <div className='text-2xl font-bold'>{totalOrders}</div>
              <p className='text-muted-foreground text-xs'>Total de órdenes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Gastado
              </CardTitle>
              <DollarSign className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP'
                }).format(totalSpent)}
              </div>
              <p className='text-muted-foreground text-xs'>
                Entre todos los clientes
              </p>
            </CardContent>
          </Card>
        </div>
        <Separator />
        {isLoading ? (
          <div className='space-y-6'>Cargando...</div>
        ) : (
          <EnhancedCustomerList customers={customers} />
        )}
      </div>
    </PageContainer>
  );
}
