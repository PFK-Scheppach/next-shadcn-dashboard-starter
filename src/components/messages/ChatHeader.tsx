'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Package } from 'lucide-react';

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
  };
}

interface ChatHeaderProps {
  pack: Pack;
  formatPrice: (amount: number, currency: string) => string;
}

export default function ChatHeader({ pack, formatPrice }: ChatHeaderProps) {
  return (
    <div className='border-b border-gray-200 bg-white p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <Avatar className='h-10 w-10'>
            <AvatarFallback className='bg-blue-500 text-white'>
              {pack.buyer.nickname.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className='font-semibold text-gray-900'>{pack.buyer.nickname}</h2>
            <p className='text-sm text-gray-500'>
              Orden #{pack.order_id || pack.id}
            </p>
          </div>
        </div>

        {pack.product_info && (
          <div className='flex items-center space-x-2 text-sm text-gray-600'>
            <Package className='h-4 w-4' />
            <span className='max-w-xs truncate'>{pack.product_info.title}</span>
            <span className='font-semibold text-green-600'>
              {formatPrice(pack.total_amount, pack.currency_id)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
