'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Send, X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ChatHeader from '@/components/messages/ChatHeader';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// shadcn-chat components
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp
} from '@/components/ui/chat/chat-bubble';
import { ChatInput } from '@/components/ui/chat/chat-input';
import { ChatMessageList } from '@/components/ui/chat/chat-message-list';

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

  const filteredPacks = packs.filter(
    (pack) =>
      pack.buyer.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.product_info?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadMessages = async (pack: Pack) => {
    setMessagesLoading(true);
    try {
      // Simular carga de mensajes
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockMessages: ApiMessage[] = [
        {
          message_id: { value: '1' },
          from: { user_id: pack.buyer.id.toString() },
          to: { user_id: pack.seller.id.toString() },
          text: '¡Hola! ¿Cuándo envían el producto?',
          message_date: {
            received: new Date(Date.now() - 3600000).toISOString()
          },
          status: 'read'
        },
        {
          message_id: { value: '2' },
          from: { user_id: pack.seller.id.toString() },
          to: { user_id: pack.buyer.id.toString() },
          text: 'Hola! El producto se enviará hoy mismo. Te pasaré el tracking apenas esté listo.',
          message_date: {
            received: new Date(Date.now() - 1800000).toISOString()
          },
          status: 'read'
        },
        {
          message_id: { value: '3' },
          from: { user_id: pack.buyer.id.toString() },
          to: { user_id: pack.seller.id.toString() },
          text: 'Perfecto, ¡muchas gracias!',
          message_date: {
            received: new Date(Date.now() - 900000).toISOString()
          },
          status: 'read'
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage || !selectedPack) return;

    setSendingMessage(true);
    try {
      const tempMessage: ApiMessage = {
        message_id: { value: Date.now().toString() },
        from: { user_id: selectedPack.seller.id.toString() },
        to: { user_id: selectedPack.buyer.id.toString() },
        text: newMessage,
        message_date: { received: new Date().toISOString() },
        status: 'sent'
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage('');

      // Simular envío
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
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
      return date.toLocaleDateString('es');
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency || 'CLP'
    }).format(amount);
  };

  // Datos de ejemplo
  const examplePacks: Pack[] = [
    {
      id: '1',
      order_id: '123456789',
      buyer: { id: 1, nickname: 'comprador123' },
      seller: { id: 2, nickname: 'vendedor' },
      date_created: new Date().toISOString(),
      order_status: 'paid',
      currency_id: 'CLP',
      total_amount: 50000,
      product_info: {
        title: 'iPhone 14 Pro Max 256GB Oro',
        thumbnail: 'https://via.placeholder.com/100',
        quantity: 1,
        unit_price: 50000
      },
      message_count: 3,
      has_messages: true,
      last_message_date: new Date().toISOString()
    },
    {
      id: '2',
      order_id: '987654321',
      buyer: { id: 3, nickname: 'cliente_vip' },
      seller: { id: 2, nickname: 'vendedor' },
      date_created: new Date().toISOString(),
      order_status: 'payment_pending',
      currency_id: 'CLP',
      total_amount: 120000,
      product_info: {
        title: 'MacBook Air M2 13" Gris Espacial',
        thumbnail: 'https://via.placeholder.com/100',
        quantity: 1,
        unit_price: 120000
      },
      message_count: 0,
      has_messages: false
    }
  ];

  useEffect(() => {
    setPacks(examplePacks);
    setLoading(false);
  }, []);

  return (
    <div className='flex h-screen bg-gray-50 dark:bg-gray-900'>
      {/* SIDEBAR - Lista de conversaciones */}
      <div className='flex w-96 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950'>
        {/* Header del sidebar */}
        <div className='border-b border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950'>
          <h1 className='mb-4 flex items-center text-2xl font-bold text-gray-900 dark:text-white'>
            <MessageSquare className='mr-3 h-6 w-6 text-blue-600' />
            Mensajes
          </h1>

          {/* Buscador */}
          <div className='relative'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <Input
              type='text'
              placeholder='Buscar conversaciones...'
              className='border-gray-200 bg-gray-50 pl-10 dark:border-gray-700 dark:bg-gray-800'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSearchTerm('')}
                className='absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-gray-400 hover:text-gray-600'
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className='mt-4 grid grid-cols-3 gap-2 text-center'>
            <div className='rounded-lg bg-blue-50 p-2 dark:bg-blue-950'>
              <div className='text-lg font-bold text-blue-700 dark:text-blue-300'>
                {filteredPacks.length}
              </div>
              <div className='text-xs text-blue-600 dark:text-blue-400'>
                Total
              </div>
            </div>
            <div className='rounded-lg bg-green-50 p-2 dark:bg-green-950'>
              <div className='text-lg font-bold text-green-700 dark:text-green-300'>
                {filteredPacks.filter((p) => p.has_messages).length}
              </div>
              <div className='text-xs text-green-600 dark:text-green-400'>
                Activos
              </div>
            </div>
            <div className='rounded-lg bg-amber-50 p-2 dark:bg-amber-950'>
              <div className='text-lg font-bold text-amber-700 dark:text-amber-300'>
                {filteredPacks.filter((p) => p.order_status === 'paid').length}
              </div>
              <div className='text-xs text-amber-600 dark:text-amber-400'>
                Pagados
              </div>
            </div>
          </div>
        </div>

        {/* Lista de conversaciones */}
        <div className='flex-1 space-y-3 overflow-y-auto p-4'>
          {filteredPacks.map((pack) => (
            <div
              key={pack.id}
              className={cn(
                'group cursor-pointer rounded-xl border p-4 transition-all duration-200',
                'hover:scale-[1.02] hover:shadow-md',
                selectedPack?.id === pack.id
                  ? 'border-blue-200 bg-blue-50 shadow-md dark:border-blue-800 dark:bg-blue-950'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800'
              )}
              onClick={() => {
                setSelectedPack(pack);
                loadMessages(pack);
              }}
            >
              <div className='flex items-start space-x-3'>
                {/* Avatar del comprador */}
                <div className='relative flex-shrink-0'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white'>
                    {pack.buyer.nickname.charAt(0).toUpperCase()}
                  </div>
                  {pack.has_messages && (
                    <div className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white'>
                      {pack.message_count > 9 ? '9+' : pack.message_count}
                    </div>
                  )}
                </div>

                {/* Información del comprador y producto */}
                <div className='min-w-0 flex-1'>
                  <div className='mb-1 flex items-center space-x-2'>
                    <p className='truncate font-semibold text-gray-900 dark:text-white'>
                      {pack.buyer.nickname}
                    </p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        pack.order_status === 'paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      )}
                    >
                      {pack.order_status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>

                  <p className='mb-2 truncate text-sm text-gray-600 dark:text-gray-400'>
                    {pack.product_info?.title}
                  </p>

                  {/* Producto con imagen */}
                  <div className='flex items-center space-x-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800'>
                    <img
                      src={pack.product_info?.thumbnail}
                      alt={pack.product_info?.title}
                      className='h-8 w-8 rounded-md object-cover'
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-product.svg';
                      }}
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-xs text-gray-500 dark:text-gray-400'>
                        Orden #{pack.order_id}
                      </p>
                    </div>
                    <span className='rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                      {pack.product_info?.quantity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredPacks.length === 0 && (
            <div className='py-8 text-center'>
              <MessageSquare className='mx-auto mb-4 h-12 w-12 text-gray-400' />
              <p className='text-gray-500 dark:text-gray-400'>
                No se encontraron conversaciones
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ÁREA DE CHAT */}
      <div className='flex flex-1 flex-col bg-white dark:bg-gray-950'>
        {selectedPack ? (
          <>
            {/* Header del chat */}
            <ChatHeader pack={selectedPack} formatPrice={formatPrice} />

            {/* Lista de mensajes con shadcn-chat */}
            <div className='relative flex-1'>
              <ChatMessageList className='h-full'>
                {messagesLoading ? (
                  <div className='flex h-full items-center justify-center'>
                    <div className='text-center'>
                      <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent' />
                      <p className='text-gray-500 dark:text-gray-400'>
                        Cargando mensajes...
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className='flex h-full items-center justify-center'>
                    <div className='text-center'>
                      <MessageSquare className='mx-auto mb-4 h-12 w-12 text-gray-400' />
                      <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-white'>
                        No hay mensajes aún
                      </h3>
                      <p className='max-w-md text-gray-500 dark:text-gray-400'>
                        Inicia la conversación enviando un mensaje al comprador.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isFromSeller =
                      message.from.user_id ===
                      selectedPack.seller.id.toString();

                    return (
                      <ChatBubble
                        key={`${message.message_id.value}-${index}`}
                        variant={isFromSeller ? 'sent' : 'received'}
                      >
                        <ChatBubbleAvatar
                          src={
                            isFromSeller
                              ? undefined
                              : `https://api.dicebear.com/7.x/initials/svg?seed=${selectedPack.buyer.nickname}`
                          }
                          fallback={
                            isFromSeller
                              ? 'V'
                              : selectedPack.buyer.nickname
                                  .charAt(0)
                                  .toUpperCase()
                          }
                        />
                        <ChatBubbleMessage
                          variant={isFromSeller ? 'sent' : 'received'}
                        >
                          <p className='text-sm leading-relaxed'>
                            {message.text}
                          </p>
                          <ChatBubbleTimestamp
                            timestamp={formatTimeAdvanced(
                              message.message_date.received
                            )}
                            className={cn(
                              'mt-2 text-xs',
                              isFromSeller
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            )}
                          />
                          {isFromSeller && message.status === 'read' && (
                            <div className='mt-1 flex justify-end'>
                              <CheckCheck className='text-primary-foreground/70 h-3 w-3' />
                            </div>
                          )}
                        </ChatBubbleMessage>
                      </ChatBubble>
                    );
                  })
                )}
              </ChatMessageList>
            </div>

            {/* Input de mensaje con shadcn-chat */}
            <div className='border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950'>
              <div className='flex space-x-3'>
                <div className='relative flex-1'>
                  <ChatInput
                    placeholder='Escribe un mensaje...'
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={sendingMessage}
                    className='pr-12'
                  />
                  {newMessage && (
                    <div className='absolute right-2 bottom-2 text-xs text-gray-400'>
                      {newMessage.length}/350
                    </div>
                  )}
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className='bg-blue-600 text-white hover:bg-blue-700'
                  size='icon'
                >
                  {sendingMessage ? (
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  ) : (
                    <Send className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Estado inicial sin conversación seleccionada */
          <div className='flex h-full items-center justify-center'>
            <div className='mx-auto max-w-md p-8 text-center'>
              <div className='mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 p-8 dark:from-blue-900 dark:to-blue-800'>
                <MessageSquare className='h-16 w-16 text-blue-600 dark:text-blue-400' />
              </div>
              <h2 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
                ¡Bienvenido al Chat Profesional! 💬
              </h2>
              <p className='mb-6 leading-relaxed text-gray-600 dark:text-gray-400'>
                Selecciona una conversación del panel izquierdo para comenzar a
                chatear con tus clientes de manera profesional y eficiente.
              </p>
              <div className='grid grid-cols-3 gap-4 text-center'>
                {[
                  { icon: '🚀', label: 'Respuestas rápidas' },
                  { icon: '📱', label: 'Notificaciones' },
                  { icon: '⭐', label: 'Mejor reputación' }
                ].map((feature, index) => (
                  <div
                    key={index}
                    className='rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800'
                  >
                    <div className='mb-1 text-2xl'>{feature.icon}</div>
                    <div className='text-xs text-gray-600 dark:text-gray-400'>
                      {feature.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
