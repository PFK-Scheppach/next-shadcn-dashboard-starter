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
          pack.buyer.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className='flex h-screen bg-gray-100'>
      {/* SIDEBAR - Lista de conversaciones */}
      <div className='flex w-80 flex-col border-r border-gray-200 bg-white'>
        {/* Header del sidebar */}
        <div className='border-b border-gray-200 p-4'>
          <h1 className='mb-3 text-xl font-bold text-gray-900'>Mensajes</h1>
          <div className='relative'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
            <Input
              placeholder='Buscar conversaciones...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        {/* Lista de conversaciones */}
        <ScrollArea className='flex-1'>
          <div className='p-2'>
            {filteredPacks.map((pack) => (
              <Card
                key={pack.id}
                className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedPack?.id === pack.id
                    ? 'bg-blue-50 ring-2 ring-blue-500'
                    : ''
                }`}
                onClick={() => {
                  setSelectedPack(pack);
                  loadMessages(pack);
                }}
              >
                <CardContent className='p-3'>
                  {/* Header del pack */}
                  <div className='mb-2 flex items-start justify-between'>
                    <div className='flex items-center space-x-2'>
                      <Avatar className='h-8 w-8'>
                        <AvatarFallback className='bg-blue-500 text-xs text-white'>
                          {pack.buyer.nickname.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          {pack.buyer.nickname}
                        </p>
                        <p className='text-xs text-gray-500'>
                          #{pack.order_id || pack.id}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs text-gray-500'>
                        {formatDate(pack.date_created)}
                      </p>
                      <div
                        className={`mt-1 h-2 w-2 rounded-full ${getStatusColor(pack.order_status)}`}
                      ></div>
                    </div>
                  </div>

                  {/* Producto */}
                  {pack.product_info && (
                    <div className='mb-2 flex items-center space-x-2'>
                      <img
                        src={
                          pack.product_info.thumbnail ||
                          '/placeholder-product.svg'
                        }
                        alt={pack.product_info.title}
                        className='h-10 w-10 rounded object-cover'
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-product.svg';
                        }}
                      />
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-xs font-medium text-gray-900'>
                          {pack.product_info.title}
                        </p>
                        <p className='text-xs font-medium text-green-600'>
                          {formatPrice(pack.total_amount, pack.currency_id)}
                        </p>
                      </div>
                      {pack.product_info.quantity > 1 && (
                        <Badge variant='secondary' className='text-xs'>
                          {pack.product_info.quantity}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className='flex items-center justify-between'>
                    <Badge
                      variant={pack.has_messages ? 'default' : 'secondary'}
                      className='text-xs'
                    >
                      <MessageSquare className='mr-1 h-3 w-3' />
                      {pack.message_count} mensajes
                    </Badge>
                    <span className='text-xs text-gray-500 capitalize'>
                      {pack.order_status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ÁREA PRINCIPAL - Chat */}
      <div className='flex flex-1 flex-col'>
        {selectedPack ? (
          <>
            <ChatHeader pack={selectedPack} formatPrice={formatPrice} />
            <ChatMessages
              pack={selectedPack}
              messages={messages}
              messagesEndRef={messagesEndRef}
              formatTime={formatTime}
              getMessageStatusIcon={getMessageStatusIcon}
              loading={messagesLoading}
            />
            <ChatInput
              value={newMessage}
              onChange={setNewMessage}
              onSend={sendMessage}
              sending={sendingMessage}
            />
          </>
        ) : (
          /* Estado sin conversación seleccionada */
          <div className='flex flex-1 items-center justify-center bg-gray-50'>
            <div className='text-center'>
              <MessageSquare className='mx-auto mb-4 h-16 w-16 text-gray-400' />
              <h3 className='mb-2 text-lg font-semibold text-gray-600'>
                Selecciona una conversación
              </h3>
              <p className='text-gray-500'>
                Elige una conversación de la lista para ver los mensajes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
