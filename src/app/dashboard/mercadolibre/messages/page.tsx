'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';

import {
  Search,
  MessageSquare,
  Check,
  CheckCheck,
  Send,
  X
} from 'lucide-react';

import ChatHeader from '@/components/messages/ChatHeader';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Pack {
  id: string;
  order_id?: string;
  buyer: {
    id: number;
    nickname: string;
  };
  seller: {
    id: number;
    nickname: string;
  };
  date_created: string;
  order_status: string;
  currency_id: string;
  total_amount: number;
  product_info?: {
    title: string;
    thumbnail: string;
    quantity: number;
    unit_price: number;
  };
  shipping?: {
    status: string;
    tracking_number?: string;
  };
  message_count: number;
  has_messages: boolean;
  last_message_date?: string;
}

interface ApiMessage {
  message_id: { value: string };
  message_date: { received: string };
  from: { user_id: string };
  to: { user_id: string };
  text: string;
  status: string;
}

export default function MessagesPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-scroll cuando lleguen nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        '/api/mercadolibre/packs?show_all=false&days_back=30&include_messages=true&prioritize_messages=true'
      );

      if (!response.ok) {
        throw new Error('Error al cargar conversaciones');
      }

      const data = await response.json();
      setPacks(data.packs || []);
    } catch (error) {
      console.error('Error loading packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (pack: Pack) => {
    try {
      setMessagesLoading(true);
      const response = await fetch(
        `/api/mercadolibre/messages/pack/${pack.id}?mark_as_read=false&limit=50`
      );

      if (!response.ok) {
        throw new Error('Error al cargar mensajes');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedPack || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const response = await fetch('/api/mercadolibre/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pack_id: selectedPack.id,
          text: newMessage.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      setNewMessage('');
      await loadMessages(selectedPack);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency || 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTimeAdvanced = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else if (diffInHours < 168) {
      // 7 días
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } else {
      return date.toLocaleDateString('es', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'delivered':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'read':
        return <CheckCheck className='ml-1 inline h-3 w-3 text-blue-500' />;
      case 'delivered':
      case 'sent':
        return <Check className='ml-1 inline h-3 w-3 text-gray-400' />;
      default:
        return null;
    }
  };

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
          pack.buyer.nickname
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          pack.product_info?.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          pack.id.includes(searchTerm)
      ),
    [searchTerm, sortedPacks]
  );

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gray-900'>
      {/* SIDEBAR MEJORADO - Lista de conversaciones */}
      <div className='flex w-96 flex-col border-r border-gray-700 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/75'>
        {/* Header mejorado con animación */}
        <div className='border-b border-gray-700/60 bg-gradient-to-r from-gray-800 via-gray-800 to-gray-700 p-4'>
          <div className='flex items-center justify-between'>
            <h1 className='flex items-center text-xl font-semibold text-white'>
              <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg'>
                <MessageSquare className='h-5 w-5 text-white' />
              </div>
              <div>
                <span className='block'>Mensajes</span>
                <span className='text-xs font-normal text-gray-400'>
                  {filteredPacks.length} conversaciones
                </span>
              </div>
            </h1>

            {/* Badge con contador de mensajes no leídos */}
            <div className='flex items-center space-x-2'>
              <div className='relative'>
                <div className='h-2 w-2 animate-pulse rounded-full bg-green-500'></div>
                <div className='absolute inset-0 h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75'></div>
              </div>
              <span className='text-xs text-green-400'>En línea</span>
            </div>
          </div>

          {/* Search mejorado */}
          <div className='relative mt-4'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='Buscar conversaciones...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full rounded-lg border border-gray-600/50 bg-gray-800/50 py-2.5 pr-4 pl-10 text-sm text-white placeholder-gray-400 backdrop-blur transition-all focus:border-blue-500/50 focus:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none'
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white'
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </div>

          {/* Stats rápidas */}
          <div className='mt-4 grid grid-cols-3 gap-3'>
            <div className='rounded-lg bg-gray-800/50 p-2.5 text-center backdrop-blur'>
              <div className='text-lg font-bold text-white'>
                {filteredPacks.length}
              </div>
              <div className='text-xs text-gray-400'>Total</div>
            </div>
            <div className='rounded-lg bg-green-900/20 p-2.5 text-center backdrop-blur'>
              <div className='text-lg font-bold text-green-400'>
                {filteredPacks.filter((p) => p.has_messages).length}
              </div>
              <div className='text-xs text-green-400'>Con mensajes</div>
            </div>
            <div className='rounded-lg bg-blue-900/20 p-2.5 text-center backdrop-blur'>
              <div className='text-lg font-bold text-blue-400'>
                {filteredPacks.filter((p) => p.order_status === 'paid').length}
              </div>
              <div className='text-xs text-blue-400'>Pagadas</div>
            </div>
          </div>
        </div>

        {/* Lista de conversaciones mejorada */}
        <div className='flex-1 overflow-hidden'>
          <div className='h-full overflow-y-auto px-2 py-2'>
            <div className='space-y-1'>
              {filteredPacks.map((pack, index) => (
                <div
                  key={pack.id}
                  className={cn(
                    'group relative cursor-pointer rounded-xl p-3 transition-all duration-300 ease-out',
                    'hover:bg-gray-800/60 hover:shadow-lg hover:backdrop-blur',
                    selectedPack?.id === pack.id
                      ? 'border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-blue-500/10 shadow-md shadow-blue-500/10'
                      : 'hover:bg-gray-700/40',
                    'transform hover:scale-[1.02] active:scale-[0.98]'
                  )}
                  onClick={() => {
                    setSelectedPack(pack);
                    loadMessages(pack);
                  }}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Indicador de selección */}
                  <div
                    className={cn(
                      'absolute top-1/2 left-0 h-8 w-1 -translate-y-1/2 rounded-r-full transition-all duration-300',
                      selectedPack?.id === pack.id
                        ? 'bg-gradient-to-b from-blue-500 to-blue-600 opacity-100'
                        : 'bg-gray-600 opacity-0 group-hover:opacity-60'
                    )}
                  />

                  <div className='flex items-start space-x-3'>
                    {/* Avatar mejorado */}
                    <div className='relative flex-shrink-0'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-lg font-bold text-white shadow-lg ring-2 ring-blue-500/20'>
                        {pack.buyer.nickname.charAt(0).toUpperCase()}
                      </div>

                      {/* Indicador de actividad */}
                      <div className='absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-800 ring-2 ring-gray-800'>
                        <div
                          className={cn(
                            'h-2.5 w-2.5 rounded-full',
                            pack.has_messages ? 'bg-green-500' : 'bg-gray-500'
                          )}
                        >
                          {pack.has_messages && (
                            <div className='absolute inset-0 h-2.5 w-2.5 animate-ping rounded-full bg-green-400 opacity-75'></div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contenido de la conversación */}
                    <div className='min-w-0 flex-1'>
                      {/* Header de la conversación */}
                      <div className='flex items-start justify-between'>
                        <div className='min-w-0 flex-1'>
                          <h3 className='truncate text-base font-semibold text-white transition-colors group-hover:text-blue-300'>
                            {pack.buyer.nickname}
                          </h3>
                          <p className='font-mono text-xs text-gray-400'>
                            #{pack.order_id || pack.id}
                          </p>
                        </div>

                        {/* Timestamp */}
                        <div className='ml-2 flex flex-col items-end space-y-1'>
                          <span className='text-xs text-gray-500'>
                            {formatTimeAdvanced(pack.date_created)}
                          </span>
                          {pack.has_messages && (
                            <div className='flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white'>
                              {pack.message_count > 9
                                ? '9+'
                                : pack.message_count}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Producto mejorado */}
                      {pack.product_info && (
                        <div className='mt-3 flex items-center space-x-2 rounded-lg bg-gray-800/40 p-2.5 backdrop-blur'>
                          <div className='relative flex-shrink-0'>
                            <img
                              src={
                                pack.product_info.thumbnail ||
                                '/placeholder-product.svg'
                              }
                              alt={pack.product_info.title}
                              className='h-8 w-8 rounded-md object-cover shadow-sm'
                              onError={(e) => {
                                e.currentTarget.src =
                                  '/placeholder-product.svg';
                              }}
                            />
                            <div className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white'>
                              {pack.product_info.quantity || 1}
                            </div>
                          </div>

                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-medium text-gray-200'>
                              {pack.product_info.title}
                            </p>
                            <p className='text-xs font-bold text-blue-400'>
                              {formatPrice(
                                pack.product_info.unit_price,
                                pack.currency_id
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Estados y badges */}
                      <div className='mt-3 flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                          {/* Badge de mensajes */}
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-all',
                              pack.has_messages
                                ? 'bg-green-500/20 text-green-300 ring-1 ring-green-500/30'
                                : 'bg-gray-700/50 text-gray-400 ring-1 ring-gray-600/30'
                            )}
                          >
                            <MessageSquare className='mr-1.5 h-3 w-3' />
                            {pack.message_count}
                          </span>
                        </div>

                        {/* Status badge mejorado */}
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-all',
                            pack.order_status === 'paid'
                              ? 'bg-green-500/20 text-green-300 ring-green-500/30'
                              : pack.order_status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-300 ring-yellow-500/30'
                                : pack.order_status === 'cancelled'
                                  ? 'bg-red-500/20 text-red-300 ring-red-500/30'
                                  : 'bg-gray-500/20 text-gray-300 ring-gray-500/30'
                          )}
                        >
                          <div
                            className={cn(
                              'mr-1.5 h-2 w-2 rounded-full',
                              pack.order_status === 'paid'
                                ? 'animate-pulse bg-green-400'
                                : pack.order_status === 'pending'
                                  ? 'animate-pulse bg-yellow-400'
                                  : pack.order_status === 'cancelled'
                                    ? 'bg-red-400'
                                    : 'bg-gray-400'
                            )}
                          />
                          {pack.order_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Efecto de hover */}
                  <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                </div>
              ))}
            </div>

            {/* Estado vacío mejorado */}
            {filteredPacks.length === 0 && (
              <div className='flex h-64 items-center justify-center'>
                <div className='text-center'>
                  <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/50 backdrop-blur'>
                    <MessageSquare className='h-8 w-8 text-gray-600' />
                  </div>
                  <p className='text-lg font-medium text-gray-300'>
                    {searchTerm ? 'Sin resultados' : 'Sin conversaciones'}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {searchTerm
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Las nuevas conversaciones aparecerán aquí'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ÁREA DE CHAT PRINCIPAL MEJORADA */}
      <div className='flex flex-1 flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
        {selectedPack ? (
          <>
            {/* Chat Header mejorado */}
            <ChatHeader pack={selectedPack} formatPrice={formatPrice} />

            {/* Área de mensajes mejorada */}
            <div className='flex min-h-0 flex-1 flex-col'>
              <div className='scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 flex-1 space-y-4 overflow-y-auto p-6'>
                {messagesLoading ? (
                  <div className='flex items-center justify-center py-12'>
                    <div className='text-center'>
                      <div className='mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
                      <p className='animate-pulse text-sm text-gray-400'>
                        Cargando mensajes...
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className='flex items-center justify-center py-16'>
                    <div className='text-center'>
                      <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-700 shadow-xl'>
                        <MessageSquare className='h-10 w-10 text-gray-500' />
                      </div>
                      <h3 className='mb-2 text-lg font-semibold text-gray-300'>
                        Sin mensajes aún
                      </h3>
                      <p className='text-sm text-gray-500'>
                        Sé el primero en iniciar la conversación
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isFromSeller =
                        message.from.user_id ===
                        selectedPack.seller.id.toString();
                      const prevMessage = messages[index - 1];
                      const isFirstFromSender =
                        !prevMessage ||
                        prevMessage.from.user_id !== message.from.user_id;

                      return (
                        <div
                          key={`${message.message_id.value}-${index}`}
                          className={cn(
                            'animate-in slide-in-from-bottom-2 fade-in-0 flex duration-300',
                            isFromSeller ? 'justify-end' : 'justify-start',
                            isFirstFromSender ? 'mt-6' : 'mt-1'
                          )}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Avatar solo en el primer mensaje del sender */}
                          {!isFromSeller && isFirstFromSender && (
                            <div className='mr-3 flex-shrink-0'>
                              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 text-xs font-bold text-white shadow-lg'>
                                {selectedPack.buyer.nickname
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            </div>
                          )}

                          {/* Espaciador para mantener alineación */}
                          {!isFromSeller && !isFirstFromSender && (
                            <div className='mr-3 w-8 flex-shrink-0' />
                          )}

                          {/* Mensaje */}
                          <div
                            className={cn('max-w-md', isFromSeller && 'mr-3')}
                          >
                            <div
                              className={cn(
                                'relative rounded-2xl px-4 py-3 shadow-lg backdrop-blur transition-all duration-200 hover:shadow-xl',
                                isFromSeller
                                  ? 'rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                                  : 'rounded-bl-md bg-gradient-to-br from-gray-700 to-gray-800 text-gray-100',
                                'group hover:scale-[1.02]'
                              )}
                            >
                              {/* Contenido del mensaje */}
                              <p className='text-sm leading-relaxed'>
                                {message.text}
                              </p>

                              {/* Metadata mejorada */}
                              <div
                                className={cn(
                                  'mt-2 flex items-center space-x-2 text-xs transition-opacity',
                                  isFromSeller
                                    ? 'justify-end text-blue-200'
                                    : 'justify-start text-gray-400',
                                  'opacity-70 group-hover:opacity-100'
                                )}
                              >
                                <span>
                                  {formatTimeAdvanced(
                                    message.message_date.received
                                  )}
                                </span>
                                {isFromSeller && (
                                  <div className='flex items-center space-x-1'>
                                    <CheckCheck className='h-3 w-3' />
                                    <span className='text-xs'>Entregado</span>
                                  </div>
                                )}
                              </div>

                              {/* Indicador de lado del mensaje */}
                              <div
                                className={cn(
                                  'absolute top-4 h-2 w-2 rotate-45 transform',
                                  isFromSeller
                                    ? '-right-1 bg-gradient-to-br from-blue-600 to-blue-700'
                                    : '-left-1 bg-gradient-to-br from-gray-700 to-gray-800'
                                )}
                              />
                            </div>
                          </div>

                          {/* Avatar del vendedor */}
                          {isFromSeller && isFirstFromSender && (
                            <div className='ml-3 flex-shrink-0'>
                              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-xs font-bold text-white shadow-lg'>
                                T
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Referencia para scroll */}
                    <div ref={messagesEndRef} className='h-1' />
                  </>
                )}
              </div>

              {/* Input mejorado */}
              <div className='border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 via-gray-800/80 to-gray-800/50 p-4 backdrop-blur'>
                <div className='mx-auto max-w-4xl'>
                  <div className='flex items-end space-x-3'>
                    {/* Campo de texto mejorado */}
                    <div className='relative flex-1'>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (newMessage.trim() && !sendingMessage) {
                              sendMessage();
                            }
                          }
                        }}
                        placeholder='Escribe tu mensaje...'
                        disabled={sendingMessage}
                        className='w-full resize-none rounded-xl border border-gray-600/50 bg-gray-700/50 px-4 py-3 text-sm text-white placeholder-gray-400 shadow-lg backdrop-blur transition-all focus:border-blue-500/50 focus:bg-gray-600/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50'
                        rows={1}
                        style={{
                          minHeight: '44px',
                          maxHeight: '120px',
                          resize: 'none'
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height =
                            Math.min(target.scrollHeight, 120) + 'px';
                        }}
                      />

                      {/* Contador de caracteres */}
                      <div className='absolute right-2 bottom-1 text-xs text-gray-500'>
                        <span
                          className={cn(
                            newMessage.length > 300 && newMessage.length <= 350
                              ? 'text-yellow-400'
                              : newMessage.length > 350
                                ? 'text-red-400'
                                : 'text-gray-500'
                          )}
                        >
                          {newMessage.length}/350
                        </span>
                      </div>
                    </div>

                    {/* Botón de envío mejorado */}
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
                        newMessage.trim() && !sendingMessage
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg hover:scale-105 hover:from-blue-700 hover:to-blue-800 active:scale-95'
                          : 'cursor-not-allowed bg-gray-600/50 text-gray-400'
                      )}
                    >
                      {sendingMessage ? (
                        <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                      ) : (
                        <Send className='h-4 w-4' />
                      )}
                    </button>
                  </div>

                  {/* Helper text mejorado */}
                  <div className='mt-3 flex items-center justify-between text-xs text-gray-500'>
                    <span className='flex items-center space-x-2'>
                      <kbd className='rounded bg-gray-700 px-1.5 py-0.5 text-xs'>
                        Enter
                      </kbd>
                      <span>para enviar</span>
                      <span className='text-gray-600'>•</span>
                      <kbd className='rounded bg-gray-700 px-1.5 py-0.5 text-xs'>
                        Shift+Enter
                      </kbd>
                      <span>nueva línea</span>
                    </span>

                    {/* Indicador de estado */}
                    <div className='flex items-center space-x-2'>
                      <div className='h-2 w-2 animate-pulse rounded-full bg-green-500'></div>
                      <span className='text-green-400'>En línea</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Estado sin selección mejorado */
          <div className='flex h-full items-center justify-center'>
            <div className='text-center'>
              <div className='mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 shadow-2xl'>
                <MessageSquare className='h-12 w-12 text-gray-500' />
              </div>
              <h2 className='mb-3 text-2xl font-bold text-gray-300'>
                Centro de Mensajes
              </h2>
              <p className='mb-6 max-w-md text-gray-500'>
                Selecciona una conversación del panel izquierdo para comenzar a
                chatear con tus clientes
              </p>

              {/* Indicadores de características */}
              <div className='flex items-center justify-center space-x-6 text-sm text-gray-600'>
                <div className='flex items-center space-x-2'>
                  <div className='h-2 w-2 rounded-full bg-green-500'></div>
                  <span>Tiempo real</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <MessageSquare className='h-4 w-4' />
                  <span>Mensajes seguros</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <CheckCheck className='h-4 w-4' />
                  <span>Confirmación de entrega</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
