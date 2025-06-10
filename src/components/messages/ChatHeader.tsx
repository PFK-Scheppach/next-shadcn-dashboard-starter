'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Package, MessageSquare, Clock } from 'lucide-react';

interface Pack {
  id: string;
  order_id?: string;
  buyer: {
    nickname: string;
  };
  seller: {
    nickname: string;
  };
  currency_id: string;
  total_amount: number;
  product_info?: {
    title: string;
    quantity: number;
  };
  order_status: string;
  message_count: number;
}

interface ChatHeaderProps {
  pack: Pack;
  formatPrice: (amount: number, currency: string) => string;
}

export default function ChatHeader({ pack, formatPrice }: ChatHeaderProps) {
  return (
    <div className='p-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <div className='relative'>
            <Avatar className='h-12 w-12 shadow-lg ring-4 ring-blue-100'>
              <AvatarFallback className='bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white'>
                {pack.buyer.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-white' />
          </div>
          <div>
            <h2 className='flex items-center space-x-2 text-xl font-bold text-slate-900'>
              <span>{pack.buyer.nickname}</span>
              <Badge
                variant='outline'
                className='border-blue-200 bg-blue-50 text-xs text-blue-700'
              >
                Cliente
              </Badge>
            </h2>
            <p className='font-mono text-sm text-slate-500'>
              Orden #{pack.order_id || pack.id}
            </p>
          </div>
        </div>

        <div className='flex items-center space-x-6'>
          {/* Información del producto si está disponible */}
          {pack.product_info && (
            <div className='text-right'>
              <p className='mb-1 max-w-xs truncate text-sm font-medium text-slate-900'>
                {pack.product_info.title}
              </p>
              <div className='flex items-center justify-end space-x-2'>
                <Badge
                  variant='secondary'
                  className='bg-emerald-50 text-xs text-emerald-700'
                >
                  ×{pack.product_info.quantity}
                </Badge>
                <p className='text-lg font-bold text-emerald-600'>
                  {formatPrice(pack.total_amount, pack.currency_id)}
                </p>
              </div>
            </div>
          )}

          {/* Estado de la orden */}
          <div className='flex flex-col items-end space-y-2'>
            <Badge
              variant='outline'
              className={`font-medium capitalize ${
                pack.order_status === 'paid'
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : pack.order_status === 'pending'
                    ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                    : pack.order_status === 'cancelled'
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-slate-300 bg-slate-50 text-slate-600'
              }`}
            >
              <div
                className={`mr-2 h-2 w-2 rounded-full ${
                  pack.order_status === 'paid'
                    ? 'bg-green-500'
                    : pack.order_status === 'pending'
                      ? 'bg-yellow-500'
                      : pack.order_status === 'cancelled'
                        ? 'bg-red-500'
                        : 'bg-slate-400'
                }`}
              />
              {pack.order_status}
            </Badge>
            <div className='flex items-center space-x-3 text-xs text-slate-500'>
              <div className='flex items-center space-x-1'>
                <MessageSquare className='h-3 w-3' />
                <span>{pack.message_count} mensajes</span>
              </div>
              <div className='flex items-center space-x-1'>
                <Clock className='h-3 w-3' />
                <span>Activo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
