'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MessageSquare, Check, CheckCheck } from 'lucide-react';

import ChatHeader from '@/components/messages/ChatHeader';
import ChatMessages from '@/components/messages/ChatMessages';
import ChatInput from '@/components/messages/ChatInput';

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    <div className='flex h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      {/* SIDEBAR - Lista de conversaciones */}
      <div className='flex w-96 flex-col border-r border-slate-200 bg-white shadow-lg'>
        {/* Header del sidebar */}
        <div className='border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white'>
          <h1 className='mb-4 text-2xl font-bold'>💬 Mensajes</h1>
          <div className='relative'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-slate-400' />
            <Input
              placeholder='Buscar conversaciones...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='border-0 bg-white/90 pl-10 focus:ring-2 focus:ring-blue-300'
            />
          </div>
        </div>

        {/* Stats rápidas */}
        <div className='border-b border-slate-200 bg-slate-50 p-4'>
          <div className='grid grid-cols-2 gap-4 text-center'>
            <div>
              <p className='text-2xl font-bold text-blue-600'>
                {filteredPacks.length}
              </p>
              <p className='text-xs text-slate-600'>Conversaciones</p>
            </div>
            <div>
              <p className='text-2xl font-bold text-green-600'>
                {filteredPacks.filter((p) => p.has_messages).length}
              </p>
              <p className='text-xs text-slate-600'>Con Mensajes</p>
            </div>
          </div>
        </div>

        {/* Lista de conversaciones */}
        <ScrollArea className='flex-1'>
          <div className='space-y-2 p-3'>
            {filteredPacks.map((pack) => (
              <Card
                key={pack.id}
                className={`cursor-pointer border-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
                  selectedPack?.id === pack.id
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg ring-2 ring-blue-400'
                    : 'bg-white shadow-sm hover:bg-slate-50'
                }`}
                onClick={() => {
                  setSelectedPack(pack);
                  loadMessages(pack);
                }}
              >
                <CardContent className='p-4'>
                  {/* Header del pack */}
                  <div className='mb-3 flex items-start justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='relative'>
                        <Avatar className='h-10 w-10 shadow-md ring-2 ring-white'>
                          <AvatarFallback className='bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white'>
                            {pack.buyer.nickname.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {pack.has_messages && (
                          <div className='absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-white' />
                        )}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-semibold text-slate-900'>
                          {pack.buyer.nickname}
                        </p>
                        <p className='font-mono text-xs text-slate-500'>
                          #{pack.order_id || pack.id}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs font-medium text-slate-500'>
                        {formatDate(pack.date_created)}
                      </p>
                      <div className='mt-1 flex justify-end'>
                        <div
                          className={`h-3 w-3 rounded-full shadow-sm ${getStatusColor(pack.order_status)}`}
                          title={pack.order_status}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Producto */}
                  {pack.product_info && (
                    <div className='mb-3 flex items-center space-x-3 rounded-lg bg-slate-50 p-3'>
                      <img
                        src={
                          pack.product_info.thumbnail ||
                          '/placeholder-product.svg'
                        }
                        alt={pack.product_info.title}
                        className='h-12 w-12 rounded-md object-cover shadow-sm ring-1 ring-slate-200'
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-product.svg';
                        }}
                      />
                      <div className='min-w-0 flex-1'>
                        <p className='mb-1 truncate text-sm font-medium text-slate-900'>
                          {pack.product_info.title}
                        </p>
                        <p className='text-sm font-bold text-emerald-600'>
                          {formatPrice(pack.total_amount, pack.currency_id)}
                        </p>
                      </div>
                      {pack.product_info.quantity > 1 && (
                        <Badge
                          variant='secondary'
                          className='bg-blue-100 text-xs text-blue-700'
                        >
                          ×{pack.product_info.quantity}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <Badge
                        variant={pack.has_messages ? 'default' : 'secondary'}
                        className={`text-xs font-medium ${
                          pack.has_messages
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <MessageSquare className='mr-1 h-3 w-3' />
                        {pack.message_count}
                      </Badge>
                      {pack.message_count > 5 && (
                        <Badge
                          variant='outline'
                          className='border-orange-300 text-xs text-orange-600'
                        >
                          Activa
                        </Badge>
                      )}
                    </div>
                    <Badge
                      variant='outline'
                      className={`text-xs font-medium capitalize ${
                        pack.order_status === 'paid'
                          ? 'border-green-300 text-green-700'
                          : pack.order_status === 'pending'
                            ? 'border-yellow-300 text-yellow-700'
                            : pack.order_status === 'cancelled'
                              ? 'border-red-300 text-red-700'
                              : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {pack.order_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredPacks.length === 0 && (
              <div className='py-12 text-center'>
                <MessageSquare className='mx-auto mb-4 h-12 w-12 text-slate-300' />
                <p className='text-sm text-slate-500'>
                  No se encontraron conversaciones
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ÁREA PRINCIPAL - Chat */}
      <div className='flex flex-1 flex-col bg-white'>
        {selectedPack ? (
          <>
            {/* Header del chat */}
            <div className='border-b border-slate-200 bg-white shadow-sm'>
              <ChatHeader pack={selectedPack} formatPrice={formatPrice} />
            </div>

            {/* Mensajes */}
            <div className='flex-1 overflow-hidden bg-gradient-to-b from-slate-50/30 to-white'>
              <ChatMessages
                pack={selectedPack}
                messages={messages}
                messagesEndRef={messagesEndRef}
                formatTime={formatTime}
                getMessageStatusIcon={getMessageStatusIcon}
                loading={messagesLoading}
              />
            </div>

            {/* Input de envío */}
            <div className='border-t border-slate-200 bg-white p-4 shadow-lg'>
              <ChatInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={sendMessage}
                sending={sendingMessage}
              />
            </div>
          </>
        ) : (
          /* Estado sin conversación seleccionada */
          <div className='flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100'>
            <div className='p-8 text-center'>
              <div className='mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200'>
                <MessageSquare className='h-10 w-10 text-blue-500' />
              </div>
              <h3 className='mb-3 text-xl font-semibold text-slate-900'>
                💬 Sistema de Mensajería
              </h3>
              <p className='mx-auto max-w-md text-sm leading-relaxed text-slate-600'>
                Selecciona una conversación de la lista para comenzar a chatear
                con tus clientes. Gestiona todas tus comunicaciones post-venta
                de forma eficiente.
              </p>
              <div className='mt-6 flex items-center justify-center space-x-6 text-xs text-slate-500'>
                <div className='flex items-center space-x-1'>
                  <div className='h-2 w-2 rounded-full bg-green-500'></div>
                  <span>En línea</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <div className='h-2 w-2 rounded-full bg-blue-500'></div>
                  <span>Mensajes nuevos</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <div className='h-2 w-2 rounded-full bg-orange-500'></div>
                  <span>Conversaciones activas</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
