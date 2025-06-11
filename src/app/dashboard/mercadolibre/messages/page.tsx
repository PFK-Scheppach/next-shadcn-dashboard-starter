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
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback } from 'react';

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

// Agregamos un nuevo componente para typing indicator
const TypingIndicator = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className='flex items-center space-x-2 px-4 py-2'
        >
          <div className='flex space-x-1'>
            <div className='h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]'></div>
            <div className='h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]'></div>
            <div className='h-2 w-2 animate-bounce rounded-full bg-gray-400'></div>
          </div>
          <span className='text-xs text-gray-400'>Escribiendo...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Componente mejorado para mensajes con animaciones más suaves
const MessageBubble = ({
  message,
  isFromSeller,
  selectedPack,
  formatTimeAdvanced,
  index
}: any) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 20,
        scale: isVisible ? 1 : 0.95
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex',
        isFromSeller ? 'justify-end' : 'justify-start',
        'mb-3'
      )}
    >
      {/* Avatar para comprador */}
      {!isFromSeller && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className='mr-3 flex-shrink-0'
        >
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 text-xs font-bold text-white shadow-lg ring-2 ring-gray-600/20'>
            {selectedPack.buyer.nickname.charAt(0).toUpperCase()}
          </div>
        </motion.div>
      )}

      {/* Mensaje */}
      <div className={cn('max-w-md', isFromSeller && 'mr-3')}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'relative rounded-2xl px-4 py-3 shadow-lg backdrop-blur transition-all duration-200',
            isFromSeller
              ? 'rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-500/25'
              : 'rounded-bl-md bg-gradient-to-br from-gray-700 to-gray-800 text-gray-100 shadow-gray-800/25',
            'group hover:shadow-xl'
          )}
        >
          {/* Contenido del mensaje */}
          <p className='text-sm leading-relaxed'>{message.text}</p>

          {/* Metadata mejorada */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
            className={cn(
              'mt-2 flex items-center space-x-2 text-xs transition-opacity',
              isFromSeller
                ? 'justify-end text-blue-200'
                : 'justify-start text-gray-400'
            )}
          >
            <span>{formatTimeAdvanced(message.message_date.received)}</span>
            {isFromSeller && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className='flex items-center space-x-1'
              >
                <CheckCheck className='h-3 w-3' />
              </motion.div>
            )}
          </motion.div>

          {/* Efecto de burbuja */}
          <div
            className={cn(
              'absolute h-3 w-3 rotate-45 transform',
              isFromSeller
                ? '-right-1 bottom-3 bg-gradient-to-br from-blue-600 to-blue-700'
                : 'bottom-3 -left-1 bg-gradient-to-br from-gray-700 to-gray-800'
            )}
          />
        </motion.div>
      </div>

      {/* Avatar para vendedor */}
      {isFromSeller && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className='ml-3 flex-shrink-0'
        >
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-xs font-bold text-white shadow-lg ring-2 ring-blue-500/30'>
            V
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Hook personalizado para scroll automático mejorado
const useAutoScroll = (dep: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const isNearBottom =
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight - 100;

      if (isNearBottom) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, dep);

  return { scrollRef, scrollToBottom };
};

export default function MessagesPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('connected');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático mejorado
  const { scrollRef, scrollToBottom } = useAutoScroll([messages]);

  const scrollToBottomOriginal = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-scroll cuando lleguen nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottomOriginal(), 100);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottomOriginal();
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

  // Simulación de typing indicator
  const handleInputChange = (value: string) => {
    setNewMessage(value);

    // Simular typing indicator
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  // Función mejorada para enviar mensaje
  const sendMessageEnhanced = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    setIsTyping(false);

    try {
      // Simular envío
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Agregar mensaje localmente para feedback inmediato
      const tempMessage: ApiMessage = {
        message_id: { value: Date.now().toString() },
        from: { user_id: 'seller' },
        to: { user_id: selectedPack?.buyer.id.toString() || '' },
        text: newMessage,
        message_date: { received: new Date().toISOString() },
        status: 'read'
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage('');

      // Aquí iría la llamada real a la API
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
    <div className='flex h-screen bg-gray-800'>
      {/* SIDEBAR - Lista de conversaciones */}
      <div className='flex w-96 flex-col border-r border-gray-700 bg-gray-900'>
        {/* Header del sidebar con indicador de conexión */}
        <div className='border-b border-gray-700 bg-gray-800 p-4'>
          <div className='mb-3 flex items-center justify-between'>
            <h1 className='flex items-center text-xl font-semibold text-white'>
              <MessageSquare className='mr-2 h-5 w-5' />
              Mensajes
            </h1>

            {/* Indicador de conexión */}
            <motion.div
              animate={{ scale: connectionStatus === 'connected' ? 1 : 0.8 }}
              className={cn(
                'flex items-center space-x-2 rounded-full px-2 py-1 text-xs',
                connectionStatus === 'connected'
                  ? 'bg-green-900/20 text-green-400'
                  : connectionStatus === 'connecting'
                    ? 'bg-yellow-900/20 text-yellow-400'
                    : 'bg-red-900/20 text-red-400'
              )}
            >
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  connectionStatus === 'connected'
                    ? 'animate-pulse bg-green-400'
                    : connectionStatus === 'connecting'
                      ? 'animate-pulse bg-yellow-400'
                      : 'bg-red-400'
                )}
              />
              <span className='capitalize'>{connectionStatus}</span>
            </motion.div>
          </div>

          {/* Search mejorado con animaciones */}
          <div className='relative mt-4'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200' />
            <input
              type='text'
              placeholder='Buscar conversaciones...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full rounded-lg border border-gray-600/50 bg-gray-800/50 py-2.5 pr-4 pl-10 text-sm text-white placeholder-gray-400 backdrop-blur transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none'
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={() => setSearchTerm('')}
                  className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-white'
                >
                  <X className='h-4 w-4' />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Stats mejorados */}
          <motion.div
            className='mt-4 grid grid-cols-3 gap-3'
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial='hidden'
            animate='show'
          >
            {[
              { label: 'Total', value: filteredPacks.length, color: 'white' },
              {
                label: 'Con mensajes',
                value: filteredPacks.filter((p) => p.has_messages).length,
                color: 'green'
              },
              {
                label: 'Pagadas',
                value: filteredPacks.filter((p) => p.order_status === 'paid')
                  .length,
                color: 'blue'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                className={cn(
                  'rounded-lg p-2.5 text-center backdrop-blur transition-all duration-200 hover:scale-105',
                  stat.color === 'green'
                    ? 'bg-green-900/20'
                    : stat.color === 'blue'
                      ? 'bg-blue-900/20'
                      : 'bg-gray-800/50'
                )}
              >
                <div
                  className={cn(
                    'text-lg font-bold',
                    stat.color === 'green'
                      ? 'text-green-400'
                      : stat.color === 'blue'
                        ? 'text-blue-400'
                        : 'text-white'
                  )}
                >
                  {stat.value}
                </div>
                <div
                  className={cn(
                    'text-xs',
                    stat.color === 'green'
                      ? 'text-green-400'
                      : stat.color === 'blue'
                        ? 'text-blue-400'
                        : 'text-gray-400'
                  )}
                >
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Lista de conversaciones mejorada */}
        <div className='flex-1 space-y-2 overflow-y-auto p-3'>
          <AnimatePresence>
            {filteredPacks.map((pack, index) => (
              <motion.div
                key={pack.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ opacity: 0, x: -20 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'group relative cursor-pointer rounded-xl p-4 transition-all duration-200',
                  'border border-gray-700/50 bg-gray-800/40 backdrop-blur',
                  'hover:bg-gray-800/60 hover:shadow-lg hover:backdrop-blur',
                  selectedPack?.id === pack.id
                    ? 'border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-blue-500/10 shadow-md shadow-blue-500/10'
                    : 'hover:bg-gray-700/40'
                )}
                onClick={() => {
                  setSelectedPack(pack);
                  loadMessages(pack);
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
                            {pack.message_count > 9 ? '9+' : pack.message_count}
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
                              e.currentTarget.src = '/placeholder-product.svg';
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DE CHAT */}
      <div className='flex flex-1 flex-col'>
        {selectedPack ? (
          <>
            {/* Header del chat */}
            <ChatHeader pack={selectedPack} formatPrice={formatPrice} />

            {/* Área de mensajes mejorada */}
            <div className='flex min-h-0 flex-1 flex-col'>
              <div
                ref={scrollRef}
                className='scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 flex-1 overflow-y-auto p-6'
              >
                {messagesLoading ? (
                  <div className='flex items-center justify-center py-12'>
                    <div className='text-center'>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                        className='mx-auto mb-4 h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent'
                      />
                      <p className='animate-pulse text-sm text-gray-400'>
                        Cargando mensajes...
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='flex h-full flex-col items-center justify-center text-center'
                  >
                    <div className='mb-4 rounded-full bg-gray-700/50 p-6'>
                      <MessageSquare className='h-12 w-12 text-gray-400' />
                    </div>
                    <h3 className='mb-2 text-lg font-semibold text-white'>
                      No hay mensajes aún
                    </h3>
                    <p className='max-w-md text-gray-400'>
                      Inicia la conversación enviando un mensaje al comprador.
                    </p>
                  </motion.div>
                ) : (
                  <div className='space-y-1'>
                    {messages.map((message, index) => (
                      <MessageBubble
                        key={`${message.message_id.value}-${index}`}
                        message={message}
                        isFromSeller={
                          message.from.user_id ===
                          selectedPack.seller.id.toString()
                        }
                        selectedPack={selectedPack}
                        formatTimeAdvanced={formatTimeAdvanced}
                        index={index}
                      />
                    ))}

                    {/* Typing indicator */}
                    <TypingIndicator isVisible={isTyping} />
                  </div>
                )}
              </div>

              {/* Input de mensaje mejorado */}
              <motion.div
                className='border-t border-gray-700 bg-gray-800/50 p-4 backdrop-blur'
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className='relative'>
                  <div className='flex space-x-3'>
                    <div className='relative flex-1'>
                      <textarea
                        value={newMessage}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (newMessage.trim() && !sendingMessage) {
                              sendMessageEnhanced();
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

                      {/* Contador de caracteres con animación */}
                      <AnimatePresence>
                        {newMessage.length > 250 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className='absolute right-2 bottom-1 text-xs text-gray-500'
                          >
                            <span
                              className={cn(
                                newMessage.length > 300
                                  ? 'text-red-400'
                                  : 'text-gray-500'
                              )}
                            >
                              {newMessage.length}/350
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Botón de envío mejorado */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendMessageEnhanced}
                      disabled={!newMessage.trim() || sendingMessage}
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
                        newMessage.trim() && !sendingMessage
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg hover:scale-105 hover:from-blue-700 hover:to-blue-800 active:scale-95'
                          : 'cursor-not-allowed bg-gray-600/50 text-gray-400'
                      )}
                    >
                      <AnimatePresence mode='wait'>
                        {sendingMessage ? (
                          <motion.div
                            key='loading'
                            initial={{ opacity: 0, rotate: 0 }}
                            animate={{ opacity: 1, rotate: 360 }}
                            exit={{ opacity: 0 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear'
                            }}
                            className='h-4 w-4 rounded-full border-2 border-white border-t-transparent'
                          />
                        ) : (
                          <motion.div
                            key='send'
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                          >
                            <Send className='h-4 w-4' />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>

                  {/* Shortcuts mejorados */}
                  <motion.div
                    className='mt-3 flex items-center justify-between text-xs text-gray-500'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className='flex items-center space-x-2'>
                      <kbd className='rounded bg-gray-700 px-1.5 py-0.5 text-xs'>
                        Enter
                      </kbd>
                      <span>para enviar</span>
                      <span className='text-gray-600'>•</span>
                      <kbd className='rounded bg-gray-700 px-1.5 py-0.5 text-xs'>
                        Shift+Enter
                      </kbd>
                      <span>nueva línea</span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={scrollToBottom}
                      className='text-gray-400 transition-colors hover:text-white'
                    >
                      ↓ Ir al final
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        ) : (
          // Estado vacío mejorado
          <motion.div
            className='flex h-full items-center justify-center'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className='mx-auto max-w-md p-8 text-center'>
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className='mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-500/10 p-6'
              >
                <MessageSquare className='h-12 w-12 text-blue-400' />
              </motion.div>
              <h2 className='mb-3 text-2xl font-bold text-white'>
                ¡Bienvenido al Chat! 💬
              </h2>
              <p className='mb-6 leading-relaxed text-gray-500'>
                Selecciona una conversación del panel izquierdo para comenzar a
                chatear con tus clientes de manera profesional y eficiente.
              </p>

              <div className='grid grid-cols-3 gap-4 text-center'>
                {[
                  { icon: '⚡', label: 'Tiempo real' },
                  { icon: '🔒', label: 'Seguro' },
                  { icon: '📱', label: 'Responsive' }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className='rounded-lg border border-gray-700/30 bg-gray-800/30 p-3'
                  >
                    <div className='mb-1 text-2xl'>{feature.icon}</div>
                    <div className='text-xs text-gray-400'>{feature.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
