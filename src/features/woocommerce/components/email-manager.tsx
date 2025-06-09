'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Mail, Send, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import type { WooOrder } from '../actions/get-orders';

interface EmailManagerProps {
  orders: WooOrder[];
  onRefresh?: () => void;
}

interface EmailStatus {
  orderId: number;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  message?: string;
}

export function EmailManager({ orders, onRefresh }: EmailManagerProps) {
  const [emailStatuses, setEmailStatuses] = useState<EmailStatus[]>([]);
  const [emailType, setEmailType] = useState<'confirmation' | 'shipped'>(
    'confirmation'
  );
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  const updateEmailStatus = (
    orderId: number,
    status: EmailStatus['status'],
    message?: string
  ) => {
    setEmailStatuses((prev) => {
      const existing = prev.find((s) => s.orderId === orderId);
      if (existing) {
        existing.status = status;
        existing.message = message;
        return [...prev];
      }
      return [...prev, { orderId, status, message }];
    });
  };

  const getEmailStatus = (orderId: number): EmailStatus | undefined => {
    return emailStatuses.find((s) => s.orderId === orderId);
  };

  const sendSingleEmail = async (order: WooOrder) => {
    updateEmailStatus(order.id, 'sending');

    try {
      const response = await fetch('/api/woocommerce/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order,
          type: emailType,
          trackingNumber: emailType === 'shipped' ? trackingNumber : undefined
        })
      });

      if (response.ok) {
        updateEmailStatus(order.id, 'sent', 'Email enviado exitosamente');
        toast.success(`Email enviado a ${order.billing.email}`);
      } else {
        const error = await response.json();
        updateEmailStatus(
          order.id,
          'failed',
          error.message || 'Error al enviar email'
        );
        toast.error(`Error al enviar email a ${order.billing.email}`);
      }
    } catch (error) {
      updateEmailStatus(order.id, 'failed', 'Error de conexión');
      toast.error('Error de conexión al enviar email');
    }
  };

  const sendBulkEmails = async () => {
    const ordersToSend = orders.filter((order) =>
      selectedOrders.includes(order.id)
    );

    if (ordersToSend.length === 0) {
      toast.error('Selecciona al menos una orden');
      return;
    }

    for (const order of ordersToSend) {
      await sendSingleEmail(order);
      // Add delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setSelectedOrders([]);
    toast.success(`Emails enviados a ${ordersToSend.length} órdenes`);
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    setSelectedOrders(orders.map((order) => order.id));
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  const getStatusIcon = (status?: EmailStatus['status']) => {
    switch (status) {
      case 'sending':
        return <Loader2 className='h-4 w-4 animate-spin text-blue-500' />;
      case 'sent':
        return <Check className='h-4 w-4 text-green-500' />;
      case 'failed':
        return <X className='h-4 w-4 text-red-500' />;
      default:
        return <Mail className='h-4 w-4 text-gray-400' />;
    }
  };

  const getStatusBadge = (status?: EmailStatus['status']) => {
    const variants = {
      sending: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      sending: 'Enviando',
      sent: 'Enviado',
      failed: 'Error',
      pending: 'Pendiente'
    };

    const variant = status || 'pending';

    return <Badge className={variants[variant]}>{labels[variant]}</Badge>;
  };

  return (
    <div className='space-y-6'>
      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Mail className='h-5 w-5' />
            Gestión de Emails
          </CardTitle>
          <CardDescription>
            Envía emails de confirmación o notificación de envío a tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-4'>
            <div className='flex-1'>
              <label className='text-sm font-medium'>Tipo de Email</label>
              <Select
                value={emailType}
                onValueChange={(value: 'confirmation' | 'shipped') =>
                  setEmailType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='confirmation'>
                    Confirmación de Orden
                  </SelectItem>
                  <SelectItem value='shipped'>Orden Enviada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {emailType === 'shipped' && (
              <div className='flex-1'>
                <label className='text-sm font-medium'>
                  Número de Seguimiento
                </label>
                <Input
                  placeholder='Ingresa el número de seguimiento'
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className='flex gap-2'>
            <Button onClick={selectAllOrders} variant='outline' size='sm'>
              Seleccionar Todas
            </Button>
            <Button onClick={clearSelection} variant='outline' size='sm'>
              Limpiar Selección
            </Button>
            <Button
              onClick={sendBulkEmails}
              disabled={selectedOrders.length === 0}
              className='ml-auto'
            >
              <Send className='mr-2 h-4 w-4' />
              Enviar a Seleccionadas ({selectedOrders.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {orders.map((order) => {
              const status = getEmailStatus(order.id);
              const isSelected = selectedOrders.includes(order.id);

              return (
                <div
                  key={order.id}
                  className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                    isSelected
                      ? 'border-blue-200 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type='checkbox'
                    checked={isSelected}
                    onChange={() => toggleOrderSelection(order.id)}
                    className='rounded'
                  />

                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>Orden #{order.id}</span>
                      {getStatusBadge(status?.status)}
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      {order.billing.first_name} {order.billing.last_name} -{' '}
                      {order.billing.email}
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      Total: ${order.total} {order.currency}
                    </p>
                    {status?.message && (
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {status.message}
                      </p>
                    )}
                  </div>

                  <div className='flex items-center gap-2'>
                    {getStatusIcon(status?.status)}
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => sendSingleEmail(order)}
                      disabled={status?.status === 'sending'}
                    >
                      {status?.status === 'sending' ? (
                        <>
                          <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                          Enviando
                        </>
                      ) : (
                        <>
                          <Send className='mr-1 h-3 w-3' />
                          Enviar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
