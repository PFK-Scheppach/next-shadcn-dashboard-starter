'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchOrders, type MercadoLibreOrder } from '@/lib/mercadolibre';

function SalesContent() {
  const [orders, setOrders] = useState<MercadoLibreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 [MercadoLibre Sales] useEffect triggered');

    const loadData = async () => {
      try {
        console.log('🔄 [MercadoLibre Sales] Starting to load initial data...');
        const data = await fetchOrders();
        console.log(`📦 [MercadoLibre Sales] Loaded ${data.length} orders`);
        setOrders(data);
        setError(null);
      } catch (error) {
        console.error('❌ [MercadoLibre Sales] Error loading orders:', error);
        setError('Error cargando las órdenes');
      } finally {
        console.log('✅ [MercadoLibre Sales] Setting loading to false');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  console.log('🔍 [MercadoLibre Sales] Render state:', {
    isLoading,
    ordersCount: orders.length,
    error
  });

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle>Cargando ventas...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='bg-muted h-20 animate-pulse rounded'></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle className='text-red-600'>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Ventas MercadoLibre</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total de órdenes: {orders.length}</p>
          {orders.length > 0 && (
            <div className='mt-4'>
              <h3 className='font-semibold'>Últimas órdenes:</h3>
              <ul className='mt-2 space-y-1'>
                {orders.slice(0, 5).map((order) => (
                  <li key={order.id} className='text-sm'>
                    Orden #{order.id} - ${order.total_amount.toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MercadoLibreSalesPage() {
  console.log('🎯 [MercadoLibre Sales] Main component rendering');

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
