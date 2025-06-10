'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Package,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShoppingCart,
  MapPin,
  Hash
} from 'lucide-react';

interface Pack {
  id: string;
  order_id: string;
  order_status: string;
  date_created: string;
  total_amount?: number;
  currency_id?: string;
  product_info?: {
    title: string;
    thumbnail: string;
    quantity: number;
    unit_price: number;
  };
  shipping?: {
    status?: string;
    tracking_number?: string;
    estimated_delivery?: string;
  };
}

interface ProductCardProps {
  pack: Pack;
  className?: string;
}

export default function ProductCard({
  pack,
  className = ''
}: ProductCardProps) {
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getOrderStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return {
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: <CheckCircle className='h-3 w-3' />,
          text: 'Pagada'
        };
      case 'pending':
        return {
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: <Clock className='h-3 w-3' />,
          text: 'Pendiente'
        };
      case 'cancelled':
        return {
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: <AlertTriangle className='h-3 w-3' />,
          text: 'Cancelada'
        };
      case 'delivered':
        return {
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          icon: <Truck className='h-3 w-3' />,
          text: 'Entregada'
        };
      default:
        return {
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: <Package className='h-3 w-3' />,
          text: status
        };
    }
  };

  const getShippingStatusInfo = (status?: string) => {
    if (!status) return null;

    switch (status.toLowerCase()) {
      case 'pending':
        return {
          color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          icon: <Clock className='h-3 w-3' />,
          text: 'Preparando envío'
        };
      case 'shipped':
        return {
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          icon: <Truck className='h-3 w-3' />,
          text: 'En camino'
        };
      case 'delivered':
        return {
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: <CheckCircle className='h-3 w-3' />,
          text: 'Entregado'
        };
      default:
        return {
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: <MapPin className='h-3 w-3' />,
          text: status
        };
    }
  };

  const orderStatus = getOrderStatusInfo(pack.order_status);
  const shippingStatus = getShippingStatusInfo(pack.shipping?.status);

  return (
    <Card
      className={`border-gray-600 bg-gradient-to-r from-gray-800 to-gray-700 shadow-lg ${className}`}
    >
      <CardContent className='p-4'>
        {/* Header con producto */}
        <div className='mb-4 flex items-start gap-4'>
          {/* Imagen del producto */}
          <div className='relative flex-shrink-0'>
            <img
              src={pack.product_info?.thumbnail || '/placeholder-product.svg'}
              alt={pack.product_info?.title || 'Producto'}
              className='h-16 w-16 rounded-lg object-cover ring-2 ring-gray-600'
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-product.svg';
              }}
            />
            <div className='absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white'>
              {pack.product_info?.quantity || 1}
            </div>
          </div>

          {/* Información del producto */}
          <div className='min-w-0 flex-1'>
            <h3 className='mb-1 line-clamp-2 text-sm leading-tight font-semibold text-white'>
              {pack.product_info?.title || 'Producto sin título'}
            </h3>

            <div className='mb-2 flex items-center gap-2 text-xs text-gray-300'>
              <Hash className='h-3 w-3' />
              <span className='font-mono'>{pack.order_id}</span>
            </div>

            {/* Precio y cantidad */}
            {pack.total_amount && (
              <div className='flex items-center gap-1 text-sm'>
                <DollarSign className='h-3 w-3 text-green-400' />
                <span className='font-semibold text-green-400'>
                  {formatPrice(pack.total_amount, pack.currency_id || 'ARS')}
                </span>
                {pack.product_info?.quantity &&
                  pack.product_info.quantity > 1 && (
                    <span className='text-xs text-gray-400'>
                      ({pack.product_info.quantity} unidades)
                    </span>
                  )}
              </div>
            )}
          </div>
        </div>

        <Separator className='mb-3 bg-gray-600' />

        {/* Información de la venta */}
        <div className='space-y-3'>
          {/* Fecha y estados */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 text-xs text-gray-300'>
              <Calendar className='h-3 w-3' />
              <span>{formatDate(pack.date_created)}</span>
            </div>

            <div className='flex items-center gap-2'>
              {/* Estado de la orden */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant='outline'
                    className={`border px-2 py-1 text-xs ${orderStatus.color}`}
                  >
                    <div className='flex items-center gap-1'>
                      {orderStatus.icon}
                      {orderStatus.text}
                    </div>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Estado de la orden</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Envío */}
          {shippingStatus && (
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2 text-xs text-gray-300'>
                <Truck className='h-3 w-3' />
                <span>Envío</span>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant='outline'
                    className={`border px-2 py-1 text-xs ${shippingStatus.color}`}
                  >
                    <div className='flex items-center gap-1'>
                      {shippingStatus.icon}
                      {shippingStatus.text}
                    </div>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Estado del envío</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Número de seguimiento si existe */}
          {pack.shipping?.tracking_number && (
            <div className='flex items-center justify-between text-xs'>
              <span className='text-gray-400'>Seguimiento:</span>
              <span className='font-mono text-blue-400'>
                {pack.shipping.tracking_number}
              </span>
            </div>
          )}
        </div>

        {/* Footer con información adicional */}
        <div className='mt-3 border-t border-gray-600 pt-3'>
          <div className='flex items-center justify-between text-xs text-gray-400'>
            <div className='flex items-center gap-1'>
              <ShoppingCart className='h-3 w-3' />
              <span>Orden ML</span>
            </div>
            <span className='font-semibold text-blue-400'>
              #{pack.order_id}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
