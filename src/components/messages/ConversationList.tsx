'use client';

import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Search,
  MessageCircle,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  ShoppingCart,
  RefreshCw,
  Star,
  Dot
} from 'lucide-react';

interface Pack {
  id: string;
  order_id: string;
  pack_id?: string;
  is_pack_id_fallback?: boolean;
  stage: string;
  status_detail?: string;
  message_count: number;
  has_messages: boolean;
  has_unread_messages: boolean;
  conversation_status: string;
  buyer: {
    id: number;
    nickname: string;
  };
  seller: {
    id: number;
    nickname: string;
  };
  date_created: string;
  last_message_date: string;
  orders_count: number;
  order_status: string;
  currency_id?: string;
  total_amount?: number;
  product_info?: {
    title: string;
    thumbnail: string;
    quantity: number;
    unit_price: number;
  };
}

interface ConversationListProps {
  packs: Pack[];
  selectedPack: Pack | null;
  onSelectPack: (pack: Pack) => void;
  onRefresh: () => void;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (search: string) => void;
}

export default function ConversationList({
  packs,
  selectedPack,
  onSelectPack,
  onRefresh,
  isLoading,
  searchTerm,
  onSearchChange
}: ConversationListProps) {
  const sortedPacks = useMemo(
    () =>
      [...packs].sort(
        (a, b) =>
          new Date(b.last_message_date || b.date_created).getTime() -
          new Date(a.last_message_date || a.date_created).getTime()
      ),
    [packs]
  );

  const filteredPacks = useMemo(
    () =>
      sortedPacks.filter(
        (pack) =>
          pack.buyer.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pack.product_info?.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          pack.id.includes(searchTerm)
      ),
    [searchTerm, sortedPacks]
  );
  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green-400 bg-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-400/20';
      case 'delivered':
        return 'text-blue-400 bg-blue-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className='h-3 w-3' />;
      case 'pending':
        return <Clock className='h-3 w-3' />;
      case 'cancelled':
        return <AlertCircle className='h-3 w-3' />;
      case 'delivered':
        return <Package className='h-3 w-3' />;
      default:
        return <Dot className='h-3 w-3' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'Pagada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'delivered':
        return 'Entregada';
      default:
        return status;
    }
  };

  // Crear vista previa del último mensaje
  const getMessagePreview = (pack: Pack) => {
    if (!pack.has_messages) {
      return (
        <span className='text-gray-500 italic'>
          Sin mensajes aún - Inicia la conversación
        </span>
      );
    }

    return (
      <span className='text-gray-400'>
        {pack.message_count} mensaje{pack.message_count !== 1 ? 's' : ''}
        {pack.has_unread_messages && ' • No leído'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className='flex h-64 flex-col items-center justify-center text-gray-400'>
        <RefreshCw className='mb-2 h-8 w-8 animate-spin' />
        <p className='text-sm'>Cargando conversaciones...</p>
      </div>
    );
  }

  if (filteredPacks.length === 0) {
    return (
      <div className='flex h-64 flex-col items-center justify-center text-gray-400'>
        <Users className='mb-4 h-16 w-16 opacity-50' />
        <h3 className='mb-2 text-lg font-medium text-white'>
          No hay conversaciones
        </h3>
        <p className='max-w-xs text-center text-sm'>
          {searchTerm
            ? `No se encontraron conversaciones para "${searchTerm}"`
            : 'Las nuevas conversaciones aparecerán aquí'}
        </p>
        {searchTerm && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onSearchChange('')}
            className='mt-2 text-blue-400 hover:text-blue-300'
          >
            Limpiar búsqueda
          </Button>
        )}
      </div>
    );
  }

  return (
    <ScrollArea className='flex-1'>
      <div className='space-y-1 p-2'>
        {filteredPacks.map((pack, index) => (
          <div
            key={`${pack.id}-${index}`}
            className={`group relative cursor-pointer rounded-xl p-3 transition-all duration-200 ${
              selectedPack?.id === pack.id
                ? 'border-2 border-blue-500/50 bg-blue-600/20 shadow-lg'
                : 'border-2 border-transparent hover:bg-gray-700/50'
            } `}
            onClick={() => onSelectPack(pack)}
          >
            {/* Indicador de no leído */}
            {pack.has_unread_messages && (
              <div className='absolute top-1/2 left-1 h-2 w-2 -translate-y-1/2 transform rounded-full bg-blue-500' />
            )}

            <div className='flex items-start gap-3'>
              {/* Avatar con indicadores */}
              <div className='relative flex-shrink-0'>
                <Avatar className='h-12 w-12 ring-2 ring-gray-600 group-hover:ring-gray-500'>
                  <AvatarImage
                    src={pack.product_info?.thumbnail}
                    alt={pack.buyer.nickname}
                    className='object-cover'
                  />
                  <AvatarFallback className='bg-gradient-to-br from-blue-600 to-purple-600 font-semibold text-white'>
                    {pack.buyer.nickname.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Indicador de estado de orden */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full text-xs ${getStatusColor(pack.order_status)} `}
                    >
                      {getStatusIcon(pack.order_status)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Orden {getStatusText(pack.order_status)}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Información principal */}
              <div className='min-w-0 flex-1 space-y-1'>
                {/* Línea superior: Nombre y tiempo */}
                <div className='flex items-center justify-between'>
                  <h3 className='truncate pr-2 font-semibold text-white'>
                    {pack.buyer.nickname}
                  </h3>
                  <div className='flex items-center gap-1 text-xs text-gray-400'>
                    <Clock className='h-3 w-3' />
                    {formatRelativeTime(
                      pack.last_message_date || pack.date_created
                    )}
                  </div>
                </div>

                {/* Producto */}
                <div className='flex items-center gap-2'>
                  <ShoppingCart className='h-3 w-3 flex-shrink-0 text-gray-500' />
                  <p className='truncate text-xs text-gray-300'>
                    {pack.product_info?.title || 'Producto sin título'}
                  </p>
                </div>

                {/* Preview de mensaje */}
                <div className='flex items-center justify-between'>
                  <div className='text-xs'>{getMessagePreview(pack)}</div>

                  {/* Badges y contadores */}
                  <div className='flex items-center gap-1'>
                    {pack.has_messages && (
                      <Badge
                        variant={
                          pack.has_unread_messages ? 'default' : 'secondary'
                        }
                        className='px-1.5 py-0.5 text-xs'
                      >
                        {pack.message_count}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Información de orden */}
                <div className='flex items-center justify-between text-xs'>
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant='outline'
                      className={`px-2 py-0.5 text-xs ${getStatusColor(pack.order_status)}`}
                    >
                      {getStatusText(pack.order_status)}
                    </Badge>
                  </div>
                  <span className='text-gray-500'>#{pack.order_id}</span>
                </div>
              </div>
            </div>

            {/* Hover effect overlay */}
            <div className='pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-blue-600/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100' />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
