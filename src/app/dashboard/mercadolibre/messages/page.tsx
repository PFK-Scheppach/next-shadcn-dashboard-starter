'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle,
  Clock,
  User,
  AlertCircle,
  Package,
  Send,
  RefreshCw,
  ShoppingCart,
  Calendar,
  Search,
  ArrowRight,
  Paperclip,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageOption {
  id: string;
  internal_description: string;
  enabled: boolean;
  type: 'template' | 'free_text';
  templates?: { id: string; vars?: any }[] | null;
  cap_available: number;
}

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
}

interface Message {
  id: string;
  text: string;
  from: {
    user_id: number;
    user_name: string;
  };
  to: {
    user_id: number;
    user_name: string;
  };
  date_created: string;
  status: string;
  attachments?: any[];
}

export default function MercadoLibreMessagesPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageOptions, setMessageOptions] = useState<MessageOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Nuevos estados para controles de filtrado
  const [showAll, setShowAll] = useState(false);
  const [daysBack, setDaysBack] = useState(30);
  const [includeMessages, setIncludeMessages] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  // Función para obtener packs (conversaciones)
  const fetchPacks = async (params?: {
    show_all?: boolean;
    days_back?: number;
    include_messages?: boolean;
  }) => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams();

      if (params?.show_all !== undefined) {
        searchParams.set('show_all', params.show_all.toString());
      } else {
        searchParams.set('show_all', showAll.toString());
      }

      if (params?.days_back !== undefined) {
        searchParams.set('days_back', params.days_back.toString());
      } else {
        searchParams.set('days_back', daysBack.toString());
      }

      if (params?.include_messages !== undefined) {
        searchParams.set(
          'include_messages',
          params.include_messages.toString()
        );
      } else {
        searchParams.set('include_messages', includeMessages.toString());
      }

      const response = await fetch(
        `/api/mercadolibre/packs?${searchParams.toString()}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch packs');
      }

      const data = await response.json();
      setPacks(data.packs || []);
      setSummary(data.summary || null);

      toast.success(`Se cargaron ${data.packs?.length || 0} conversaciones`);
    } catch (error) {
      console.error('Error fetching packs:', error);
      toast.error('No se pudieron cargar las conversaciones');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener mensajes de un pack
  const fetchMessages = async (packId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(
        `/api/mercadolibre/messages/pack/${packId}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('No se pudieron cargar los mensajes');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Función para obtener opciones de comunicación
  const fetchMessageOptions = async (packId: string) => {
    try {
      const response = await fetch(
        `/api/mercadolibre/messages/options?pack_id=${packId}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch message options');
      }

      const data = await response.json();
      setMessageOptions(data.options || []);
    } catch (error) {
      console.error('Error fetching message options:', error);
    }
  };

  // Función para iniciar conversación
  const initiateConversation = async () => {
    if (!selectedPack || !selectedOption) return;

    setIsSending(true);
    try {
      let requestBody: any = {
        pack_id: selectedPack.id,
        option_id: selectedOption
      };

      // Si es una opción de template, incluir template_id
      const option = messageOptions.find((opt) => opt.id === selectedOption);
      if (option?.type === 'template' && selectedTemplate) {
        requestBody.template_id = selectedTemplate;
      }

      // Si es texto libre, incluir el texto
      if (option?.type === 'free_text' && newMessage.trim()) {
        requestBody.text = newMessage.trim();
      }

      const response = await fetch('/api/mercadolibre/messages/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate conversation');
      }

      const result = await response.json();

      toast.success('Conversación iniciada correctamente');

      // Refrescar mensajes
      await fetchMessages(selectedPack.id);
      setNewMessage('');
      setSelectedOption('');
      setSelectedTemplate('');
    } catch (error: any) {
      console.error('Error initiating conversation:', error);
      toast.error(error.message || 'No se pudo iniciar la conversación');
    } finally {
      setIsSending(false);
    }
  };

  // Función para enviar mensaje directo (cuando ya existe conversación)
  const sendDirectMessage = async () => {
    if (!selectedPack || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch(
        `/api/mercadolibre/messages/pack/${selectedPack.id}/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: newMessage.trim(),
            to_user_id: selectedPack.buyer.id
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const result = await response.json();

      toast.success('Mensaje enviado correctamente');

      // Refrescar mensajes
      await fetchMessages(selectedPack.id);
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'No se pudo enviar el mensaje');
    } finally {
      setIsSending(false);
    }
  };

  // Función para seleccionar un pack
  const handleSelectPack = async (pack: Pack) => {
    setSelectedPack(pack);
    await Promise.all([fetchMessages(pack.id), fetchMessageOptions(pack.id)]);
  };

  // Función separada para el botón de refresh
  const handleRefreshPacks = () => {
    fetchPacks();
  };

  // Función para cambiar filtros y recargar
  const handleFilterChange = () => {
    fetchPacks();
  };

  // Cargar packs al montar el componente
  useEffect(() => {
    fetchPacks();
  }, []);

  const renderPacksList = () => (
    <div className='grid gap-4'>
      {packs.map((pack) => {
        // Determinar color del badge según el estado
        const getStatusBadgeColor = (status: string) => {
          switch (status) {
            case 'confirmed':
              return 'bg-green-100 text-green-700';
            case 'paid':
              return 'bg-blue-100 text-blue-700';
            case 'shipped':
              return 'bg-purple-100 text-purple-700';
            case 'delivered':
              return 'bg-emerald-100 text-emerald-700';
            case 'cancelled':
              return 'bg-red-100 text-red-700';
            default:
              return 'bg-gray-100 text-gray-700';
          }
        };

        const getConversationStatusColor = (status: string) => {
          switch (status) {
            case 'active':
              return 'bg-green-100 text-green-700';
            case 'blocked':
              return 'bg-red-100 text-red-700';
            case 'error':
              return 'bg-yellow-100 text-yellow-700';
            default:
              return 'bg-gray-100 text-gray-700';
          }
        };

        return (
          <Card
            key={pack.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedPack?.id === pack.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : ''
            }`}
            onClick={() => handleSelectPack(pack)}
          >
            <CardContent className='pt-4'>
              <div className='space-y-3'>
                {/* Header con información principal */}
                <div className='flex items-start justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex flex-col items-center'>
                      <Package
                        className={`h-5 w-5 ${pack.has_messages ? 'text-green-500' : 'text-gray-400'}`}
                      />
                      {pack.is_pack_id_fallback && (
                        <span className='text-xs text-orange-500'>F</span>
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium'>
                        {pack.is_pack_id_fallback ? 'Orden' : 'Pack'} #{pack.id}
                      </p>
                      <p className='truncate text-sm text-gray-500'>
                        Cliente: {pack.buyer.nickname}
                      </p>
                      {pack.orders_count > 1 && (
                        <p className='text-xs text-blue-600'>
                          {pack.orders_count} órdenes en este pack
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges de estado */}
                  <div className='flex flex-col items-end space-y-1'>
                    {pack.has_unread_messages && (
                      <Badge variant='destructive' className='text-xs'>
                        Nuevo
                      </Badge>
                    )}
                    {pack.has_messages ? (
                      <Badge
                        variant='default'
                        className='bg-green-100 text-xs text-green-700'
                      >
                        {pack.message_count} mensaje
                        {pack.message_count !== 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='text-xs'>
                        Sin mensajes
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Estados de orden y conversación */}
                <div className='flex flex-wrap gap-2'>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeColor(pack.order_status)}`}
                  >
                    Orden: {pack.order_status}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getConversationStatusColor(pack.conversation_status)}`}
                  >
                    Chat: {pack.conversation_status}
                  </span>
                </div>

                {/* Información adicional */}
                <div className='space-y-1 text-xs text-gray-500'>
                  <div className='flex justify-between'>
                    <span>Orden original: #{pack.order_id}</span>
                    {pack.total_amount && (
                      <span>
                        {pack.currency_id} {pack.total_amount}
                      </span>
                    )}
                  </div>
                  <div>
                    Creado: {new Date(pack.date_created).toLocaleDateString()}
                  </div>
                  {pack.last_message_date !== pack.date_created && (
                    <div>
                      Último mensaje:{' '}
                      {new Date(pack.last_message_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderMessages = () => (
    <div className='space-y-4'>
      {messages.map((message) => {
        const isFromSeller =
          message.from.user_id.toString() ===
          process.env.NEXT_PUBLIC_MERCADOLIBRE_SELLER_ID;
        return (
          <div
            key={message.id}
            className={`flex ${isFromSeller ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-lg px-4 py-2 lg:max-w-md ${
                isFromSeller
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className='text-sm'>{message.text}</p>
              <div className='mt-2 flex items-center justify-between text-xs opacity-75'>
                <span>{message.from.user_name}</span>
                <span>{new Date(message.date_created).toLocaleString()}</span>
              </div>
              {message.status && (
                <div className='mt-1 text-xs opacity-75'>
                  Estado: {message.status}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderMessageForm = () => {
    const hasExistingConversation = messages.length > 0;

    return (
      <div className='space-y-4'>
        {!hasExistingConversation && messageOptions.length > 0 && (
          <div className='space-y-3'>
            <h4 className='font-medium'>
              Opciones de comunicación disponibles:
            </h4>
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className='w-full rounded-md border p-2'
            >
              <option value=''>Seleccionar motivo de contacto...</option>
              {messageOptions
                .filter((opt) => opt.enabled && opt.cap_available > 0)
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.internal_description} ({option.cap_available}{' '}
                    disponible{option.cap_available !== 1 ? 's' : ''})
                  </option>
                ))}
            </select>

            {selectedOption &&
              (() => {
                const option = messageOptions.find(
                  (opt) => opt.id === selectedOption
                );
                if (option?.type === 'template' && option.templates) {
                  return (
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className='w-full rounded-md border p-2'
                    >
                      <option value=''>Seleccionar plantilla...</option>
                      {option.templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.id}
                        </option>
                      ))}
                    </select>
                  );
                }
                return null;
              })()}
          </div>
        )}

        {(hasExistingConversation ||
          (selectedOption &&
            messageOptions.find((opt) => opt.id === selectedOption)?.type ===
              'free_text')) && (
          <div className='space-y-3'>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder='Escribe tu mensaje aquí...'
              maxLength={350}
              rows={3}
            />
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500'>
                {newMessage.length}/350 caracteres
              </span>
              <Button
                onClick={
                  hasExistingConversation
                    ? sendDirectMessage
                    : initiateConversation
                }
                disabled={
                  isSending ||
                  !newMessage.trim() ||
                  (!hasExistingConversation && !selectedOption)
                }
              >
                {isSending ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className='mr-2 h-4 w-4' />
                    {hasExistingConversation
                      ? 'Enviar Mensaje'
                      : 'Iniciar Conversación'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <PageContainer scrollable>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Heading
            title='Mensajes MercadoLibre'
            description='Gestiona las conversaciones con tus compradores usando packs de órdenes'
          />
          <Button
            onClick={handleRefreshPacks}
            disabled={isLoading}
            variant='outline'
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>
        </div>

        {/* Controles de filtrado */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Search className='h-5 w-5' />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='showAll'
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className='rounded'
                />
                <label htmlFor='showAll' className='text-sm font-medium'>
                  Mostrar TODOS los packs
                </label>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Días atrás</label>
                <Input
                  type='number'
                  value={daysBack}
                  onChange={(e) => setDaysBack(parseInt(e.target.value) || 30)}
                  min='1'
                  max='365'
                  disabled={showAll}
                  className='w-full'
                />
              </div>

              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='includeMessages'
                  checked={includeMessages}
                  onChange={(e) => setIncludeMessages(e.target.checked)}
                  className='rounded'
                />
                <label
                  htmlFor='includeMessages'
                  className='text-sm font-medium'
                >
                  Contar mensajes
                </label>
              </div>

              <div className='flex space-x-2'>
                <Button
                  onClick={handleFilterChange}
                  disabled={isLoading}
                  className='flex-1'
                >
                  <Search className='mr-2 h-4 w-4' />
                  Buscar
                </Button>
                <Button
                  onClick={handleRefreshPacks}
                  disabled={isLoading}
                  variant='outline'
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>
            </div>

            {/* Resumen de resultados */}
            {summary && (
              <div className='mt-4 grid grid-cols-2 gap-4 md:grid-cols-5'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {summary.total_packs}
                  </div>
                  <div className='text-sm text-gray-500'>Total Packs</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {summary.packs_with_messages}
                  </div>
                  <div className='text-sm text-gray-500'>Con Mensajes</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-gray-600'>
                    {summary.packs_without_messages}
                  </div>
                  <div className='text-sm text-gray-500'>Sin Mensajes</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {summary.conversation_statuses?.blocked || 0}
                  </div>
                  <div className='text-sm text-gray-500'>Bloqueadas</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-red-600'>
                    {summary.order_statuses?.cancelled || 0}
                  </div>
                  <div className='text-sm text-gray-500'>Canceladas</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Panel izquierdo: Lista de packs */}
          <div className='lg:col-span-1'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Package className='h-5 w-5' />
                  Packs Disponibles
                </CardTitle>
                <CardDescription>
                  {packs.length} packs encontrados
                </CardDescription>
                <div className='relative'>
                  <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                  <Input
                    placeholder='Buscar por comprador, pack ID o producto...'
                    className='pl-10'
                  />
                </div>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='max-h-[600px] overflow-y-auto'>
                  {isLoading ? (
                    <div className='text-muted-foreground p-4 text-center'>
                      <RefreshCw className='mx-auto mb-2 h-6 w-6 animate-spin' />
                      Cargando packs...
                    </div>
                  ) : packs.length === 0 ? (
                    <div className='text-muted-foreground p-4 text-center'>
                      <Package className='mx-auto mb-2 h-8 w-8 opacity-50' />
                      No se encontraron packs
                    </div>
                  ) : (
                    renderPacksList()
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel derecho: Mensajes del pack seleccionado */}
          <div className='lg:col-span-2'>
            <Card className='h-full'>
              {selectedPack ? (
                <>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <MessageCircle className='h-5 w-5' />
                      Conversación con {selectedPack.buyer.nickname}
                    </CardTitle>
                    <CardDescription>
                      Pack ID: {selectedPack.id}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className='flex h-[600px] flex-col'>
                    {/* Área de mensajes */}
                    <div className='bg-muted/10 mb-4 flex-1 overflow-y-auto rounded-md border p-4'>
                      {isLoadingMessages ? (
                        <div className='text-muted-foreground text-center'>
                          <RefreshCw className='mx-auto mb-2 h-6 w-6 animate-spin' />
                          Cargando mensajes...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className='text-muted-foreground text-center'>
                          <MessageCircle className='mx-auto mb-2 h-8 w-8 opacity-50' />
                          No hay mensajes en esta conversación
                          <br />
                          <span className='text-sm'>
                            Sé el primero en escribir
                          </span>
                        </div>
                      ) : (
                        renderMessages()
                      )}
                    </div>

                    {/* Formulario para enviar mensaje */}
                    <div className='flex gap-2'>{renderMessageForm()}</div>
                  </CardContent>
                </>
              ) : (
                <CardContent className='flex h-[600px] items-center justify-center'>
                  <div className='text-muted-foreground text-center'>
                    <Package className='mx-auto mb-4 h-12 w-12 opacity-50' />
                    <h3 className='mb-2 text-lg font-medium'>
                      Selecciona un pack
                    </h3>
                    <p className='text-sm'>
                      Elige un pack de la lista para ver y gestionar la
                      conversación
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
