'use client';

import { MessageSquare, Clock } from 'lucide-react';

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
    <div className='border-b border-gray-700 bg-gray-800 p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='relative'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white'>
              {pack.buyer.nickname.charAt(0).toUpperCase()}
            </div>
            <div className='absolute -right-0 -bottom-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-gray-800' />
          </div>
          <div>
            <h2 className='flex items-center space-x-2 text-lg font-semibold text-white'>
              <span>{pack.buyer.nickname}</span>
              <span className='inline-flex rounded-full bg-blue-900 px-2 py-1 text-xs font-medium text-blue-300'>
                Cliente
              </span>
            </h2>
            <p className='font-mono text-sm text-gray-400'>
              Orden #{pack.order_id || pack.id}
            </p>
          </div>
        </div>

        <div className='flex items-center space-x-4'>
          {/* Información del producto si está disponible */}
          {pack.product_info && (
            <div className='text-right'>
              <p className='mb-1 max-w-xs truncate text-sm font-medium text-gray-300'>
                {pack.product_info.title}
              </p>
              <div className='flex items-center justify-end space-x-2'>
                <span className='inline-flex rounded-full bg-emerald-900 px-2 py-1 text-xs font-medium text-emerald-300'>
                  ×{pack.product_info.quantity}
                </span>
                <p className='text-lg font-bold text-emerald-400'>
                  {formatPrice(pack.total_amount, pack.currency_id)}
                </p>
              </div>
            </div>
          )}

          {/* Estado de la orden */}
          <div className='flex flex-col items-end space-y-2'>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${
                pack.order_status === 'paid'
                  ? 'bg-green-900 text-green-300'
                  : pack.order_status === 'pending'
                    ? 'bg-yellow-900 text-yellow-300'
                    : pack.order_status === 'cancelled'
                      ? 'bg-red-900 text-red-300'
                      : 'bg-gray-700 text-gray-400'
              }`}
            >
              <div
                className={`mr-2 h-2 w-2 rounded-full ${
                  pack.order_status === 'paid'
                    ? 'bg-green-400'
                    : pack.order_status === 'pending'
                      ? 'bg-yellow-400'
                      : pack.order_status === 'cancelled'
                        ? 'bg-red-400'
                        : 'bg-gray-400'
                }`}
              />
              {pack.order_status}
            </span>
            <div className='flex items-center space-x-3 text-xs text-gray-500'>
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
