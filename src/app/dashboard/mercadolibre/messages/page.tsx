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
  stage: string;
  message_count: number;
  has_unread_messages: boolean;
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

  // Función para obtener packs (conversaciones)
  const fetchPacks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mercadolibre/packs', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch packs');
      }

      const data = await response.json();
      setPacks(data.packs || []);
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

  // Cargar packs al montar el componente
  useEffect(() => {
    fetchPacks();
  }, []);

  const renderPacksList = () => (
    <div className='grid gap-4'>
      {packs.map((pack) => (
        <Card
          key={pack.id}
          className={`cursor-pointer transition-colors hover:bg-gray-50 ${
            selectedPack?.id === pack.id ? 'border-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => handleSelectPack(pack)}
        >
          <CardContent className='pt-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <Package className='h-5 w-5 text-blue-500' />
                <div>
                  <p className='font-medium'>Orden #{pack.order_id}</p>
                  <p className='text-sm text-gray-500'>
                    Cliente: {pack.buyer.nickname}
                  </p>
                </div>
              </div>
              <div className='flex items-center space-x-2'>
                {pack.has_unread_messages && (
                  <Badge variant='destructive'>Nuevo</Badge>
                )}
                <Badge variant='outline'>
                  {pack.message_count} mensaje
                  {pack.message_count !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            <div className='mt-2 text-xs text-gray-400'>
              Pack ID: {pack.id} • Etapa: {pack.stage}
            </div>
          </CardContent>
        </Card>
      ))}
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
          <Button onClick={fetchPacks} disabled={isLoading} variant='outline'>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>
        </div>

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
