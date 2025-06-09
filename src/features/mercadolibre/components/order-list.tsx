'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { MessageSquare, Eye, DollarSign, Calendar, User } from 'lucide-react';
import { MercadoLibreOrder } from '@/lib/mercadolibre';

interface MercadoLibreOrderListProps {
  orders: MercadoLibreOrder[];
}

export function MercadoLibreOrderList({ orders }: MercadoLibreOrderListProps) {
  const [selectedOrder, setSelectedOrder] = useState<MercadoLibreOrder | null>(
    null
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const handleSendMessage = async (orderId: number) => {
    // Redirect to messages page with order context
    window.location.href = `/dashboard/mercadolibre/messages?order=${orderId}`;
  };

  const totalSales = orders.reduce(
    (total, order) => total + order.total_amount,
    0
  );
  const averageOrderValue = orders.length > 0 ? totalSales / orders.length : 0;

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Ventas</CardTitle>
            <DollarSign className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Órdenes Totales
            </CardTitle>
            <User className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Valor Promedio
            </CardTitle>
            <Calendar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(averageOrderValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes de MercadoLibre</CardTitle>
          <CardDescription>
            Lista de todas las órdenes recibidas desde MercadoLibre
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className='py-8 text-center'>
              <p className='text-muted-foreground'>
                No hay órdenes disponibles
              </p>
              <p className='text-muted-foreground mt-2 text-sm'>
                Las órdenes aparecerán aquí cuando se configuren las
                credenciales de MercadoLibre
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden ID</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className='font-medium'>#{order.id}</TableCell>
                    <TableCell>{order.buyer.nickname}</TableCell>
                    <TableCell>{formatDate(order.date_created)}</TableCell>
                    <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                    <TableCell>
                      <Badge variant='secondary'>Completada</Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Detalles de la Orden #{order.id}
                              </DialogTitle>
                              <DialogDescription>
                                Información completa de la orden de MercadoLibre
                              </DialogDescription>
                            </DialogHeader>
                            <div className='space-y-4'>
                              <div>
                                <h4 className='font-semibold'>Comprador</h4>
                                <p>{order.buyer.nickname}</p>
                              </div>
                              <div>
                                <h4 className='font-semibold'>
                                  Fecha de Creación
                                </h4>
                                <p>{formatDate(order.date_created)}</p>
                              </div>
                              <div>
                                <h4 className='font-semibold'>Total</h4>
                                <p className='text-lg font-bold text-green-600'>
                                  {formatCurrency(order.total_amount)}
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleSendMessage(order.id)}
                        >
                          <MessageSquare className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
