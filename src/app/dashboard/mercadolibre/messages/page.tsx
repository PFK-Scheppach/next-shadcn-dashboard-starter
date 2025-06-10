'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';

import { Search, MessageSquare, Check, CheckCheck, Send } from 'lucide-react';

import ChatHeader from '@/components/messages/ChatHeader';

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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div className='flex h-screen bg-gray-800'>
      {/* SIDEBAR - Lista de conversaciones */}
      <div className='flex w-96 flex-col border-r border-gray-700 bg-gray-900'>
        {/* Header del sidebar */}
        <div className='border-b border-gray-700 bg-gray-800 p-4'>
          <h1 className='mb-3 flex items-center text-xl font-semibold text-white'>
            <MessageSquare className='mr-2 h-5 w-5' />
            Mensajes
          </h1>
          <div className='relative'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
            <Input
              placeholder='Buscar conversaciones...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='border-gray-600 bg-gray-700 pl-10 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            />
          </div>
        </div>

        {/* Stats rápidas */}
        <div className='border-b border-gray-700 bg-gray-800 p-3'>
          <div className='grid grid-cols-2 gap-3 text-center'>
            <div className='rounded-lg bg-gray-700 p-2'>
              <p className='text-lg font-bold text-blue-400'>
                {filteredPacks.length}
              </p>
              <p className='text-xs text-gray-400'>Total</p>
            </div>
            <div className='rounded-lg bg-gray-700 p-2'>
              <p className='text-lg font-bold text-green-400'>
                {filteredPacks.filter((p) => p.has_messages).length}
              </p>
              <p className='text-xs text-gray-400'>Activas</p>
            </div>
          </div>
        </div>

        {/* Lista de conversaciones */}
        <div className='flex-1 overflow-y-auto'>
          <div className='space-y-1 p-2'>
            {filteredPacks.map((pack) => (
              <div
                key={pack.id}
                className={`cursor-pointer rounded-lg p-3 transition-all duration-200 hover:bg-gray-700 ${
                  selectedPack?.id === pack.id
                    ? 'border-l-4 border-blue-500 bg-gray-700'
                    : 'hover:bg-gray-800'
                }`}
                onClick={() => {
                  setSelectedPack(pack);
                  loadMessages(pack);
                }}
              >
                {/* Header del pack */}
                <div className='mb-2 flex items-start justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='relative'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white'>
                        {pack.buyer.nickname.charAt(0).toUpperCase()}
                      </div>
                      {pack.has_messages && (
                        <div className='absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500' />
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium text-white'>
                        {pack.buyer.nickname}
                      </p>
                      <p className='font-mono text-xs text-gray-400'>
                        #{pack.order_id || pack.id}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-gray-400'>
                      {formatDate(pack.date_created)}
                    </p>
                    <div className='mt-1 flex justify-end'>
                      <div
                        className={`h-2 w-2 rounded-full ${getStatusColor(pack.order_status)}`}
                        title={pack.order_status}
                      />
                    </div>
                  </div>
                </div>

                {/* Producto */}
                {pack.product_info && (
                  <div className='mb-2 flex items-center space-x-2 rounded bg-gray-800 p-2'>
                    <img
                      src={
                        pack.product_info.thumbnail ||
                        '/placeholder-product.svg'
                      }
                      alt={pack.product_info.title}
                      className='h-8 w-8 rounded object-cover'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-product.svg';
                      }}
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-xs text-gray-300'>
                        {pack.product_info.title}
                      </p>
                      <p className='text-xs font-semibold text-green-400'>
                        {formatPrice(pack.total_amount, pack.currency_id)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        pack.has_messages
                          ? 'bg-green-900 text-green-300'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      <MessageSquare className='mr-1 h-3 w-3' />
                      {pack.message_count}
                    </span>
                  </div>
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
                    {pack.order_status}
                  </span>
                </div>
              </div>
            ))}

            {filteredPacks.length === 0 && (
              <div className='py-8 text-center'>
                <MessageSquare className='mx-auto mb-3 h-8 w-8 text-gray-600' />
                <p className='text-sm text-gray-400'>
                  {searchTerm
                    ? 'No se encontraron conversaciones'
                    : 'No hay conversaciones'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ÁREA DE CHAT */}
      <div className='flex flex-1 flex-col bg-gray-900'>
        {selectedPack ? (
          <>
            {/* Chat Header */}
            <ChatHeader pack={selectedPack} formatPrice={formatPrice} />

            {/* Mensajes */}
            <div className='flex min-h-0 flex-1 flex-col'>
              <div className='flex-1 space-y-4 overflow-y-auto p-4'>
                {messagesLoading ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='text-center'>
                      <div className='mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
                      <p className='text-sm text-gray-400'>
                        Cargando mensajes...
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className='flex items-center justify-center py-12'>
                    <div className='text-center'>
                      <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800'>
                        <MessageSquare className='h-6 w-6 text-gray-500' />
                      </div>
                      <h3 className='mb-2 text-lg font-medium text-gray-300'>
                        Sin mensajes aún
                      </h3>
                      <p className='mb-4 max-w-sm text-sm text-gray-500'>
                        Inicia la conversación con este cliente
                      </p>
                      <div className='rounded-lg bg-blue-900/50 px-3 py-2 text-xs text-blue-300'>
                        💡 Tip: Un saludo siempre es buen comienzo
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isFromSeller =
                        message.from.user_id ===
                        selectedPack.seller.id.toString();

                      return (
                        <div
                          key={`${message.message_id.value}-${index}`}
                          className={`flex items-end space-x-2 ${isFromSeller ? 'flex-row-reverse space-x-reverse' : ''}`}
                        >
                          {/* Avatar */}
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                              isFromSeller
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-200'
                            }`}
                          >
                            {isFromSeller
                              ? 'T'
                              : selectedPack.buyer.nickname
                                  .charAt(0)
                                  .toUpperCase()}
                          </div>

                          {/* Mensaje */}
                          <div className={`max-w-md`}>
                            <div
                              className={`rounded-2xl px-3 py-2 ${
                                isFromSeller
                                  ? 'rounded-br-md bg-blue-600 text-white'
                                  : 'rounded-bl-md bg-gray-700 text-gray-100'
                              }`}
                            >
                              <p className='text-sm'>{message.text}</p>
                            </div>

                            {/* Metadata */}
                            <div
                              className={`mt-1 flex items-center space-x-1 text-xs text-gray-500 ${
                                isFromSeller ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <span>
                                {formatTime(message.message_date.received)}
                              </span>
                              {isFromSeller && (
                                <span className='flex items-center'>
                                  {getMessageStatusIcon(message.status)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input de mensaje */}
              <div className='border-t border-gray-700 bg-gray-800 p-4'>
                <div className='flex items-end space-x-3'>
                  <div className='flex-1'>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder='Escribe tu mensaje...'
                      disabled={sendingMessage}
                      className='w-full resize-none rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className={`rounded-lg p-3 transition-all duration-200 ${
                      newMessage.trim() && !sendingMessage
                        ? 'transform bg-blue-600 text-white hover:scale-105 hover:bg-blue-700'
                        : 'cursor-not-allowed bg-gray-600 text-gray-400'
                    }`}
                  >
                    {sendingMessage ? (
                      <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                    ) : (
                      <Send className='h-4 w-4' />
                    )}
                  </button>
                </div>

                {/* Tips */}
                <div className='mt-2 flex items-center justify-between text-xs text-gray-500'>
                  <span>Enter para enviar • Shift+Enter para nueva línea</span>
                  <span
                    className={`font-mono ${newMessage.length > 300 ? 'text-orange-400' : newMessage.length > 350 ? 'text-red-400' : ''}`}
                  >
                    {newMessage.length}/350
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className='flex h-full items-center justify-center'>
            <div className='text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800'>
                <MessageSquare className='h-8 w-8 text-gray-600' />
              </div>
              <h3 className='mb-2 text-lg font-medium text-gray-300'>
                Selecciona una conversación
              </h3>
              <p className='text-sm text-gray-500'>
                Elige una conversación del panel izquierdo para comenzar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
