'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  MessageCircle,
  Clock,
  User,
  Search,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Calendar,
  ArrowUpDown
} from 'lucide-react';
import { MessageReplyForm } from '@/features/mercadolibre/components/message-reply-form';
import {
  formatMessageDate,
  type MessageThread
} from '@/features/mercadolibre/utils/messages';

interface EnhancedMessagesListProps {
  initialThreads: MessageThread[];
}

type SortField = 'date' | 'buyer' | 'messages';
type SortOrder = 'asc' | 'desc';

export function EnhancedMessagesList({
  initialThreads
}: EnhancedMessagesListProps) {
  const [threads] = useState<MessageThread[]>(initialThreads);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(
    null
  );
  const [showMessageHistory, setShowMessageHistory] = useState<
    Record<string, boolean>
  >({});

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24)
      return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30)
      return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `Hace ${diffInMonths} mes${diffInMonths !== 1 ? 'es' : ''}`;
  };

  // Filter and sort threads - UPDATED for new MessageThread interface
  const filteredAndSortedThreads = useMemo(() => {
    let filtered = threads.filter(
      (thread) =>
        thread.buyer.nickname
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        thread.pack_id.toString().includes(searchTerm)
    );

    // Sort threads
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison =
            new Date(a.lastMessageDate).getTime() -
            new Date(b.lastMessageDate).getTime();
          break;
        case 'buyer':
          comparison = a.buyer.nickname.localeCompare(b.buyer.nickname);
          break;
        case 'messages':
          comparison = a.messages.length - b.messages.length;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [threads, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedThreads.length / pageSize);
  const paginatedThreads = filteredAndSortedThreads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ArrowUpDown className='h-4 w-4 opacity-50' />;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const toggleMessageHistory = (threadKey: string) => {
    setShowMessageHistory((prev) => ({
      ...prev,
      [threadKey]: !prev[threadKey]
    }));
  };

  const getMessagesToShow = (thread: MessageThread) => {
    const threadKey = `${thread.pack_id}-${thread.buyer.id}`;
    const showAll = showMessageHistory[threadKey];
    return showAll ? thread.messages : thread.messages.slice(-3);
  };

  if (threads.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <MessageCircle className='text-muted-foreground mb-4 h-12 w-12' />
          <h3 className='mb-2 text-lg font-semibold'>No hay mensajes</h3>
          <p className='text-muted-foreground text-center'>
            Cuando recibas mensajes de compradores, aparecerán aquí.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MessageSquare className='h-5 w-5' />
          Conversaciones
        </CardTitle>
        <CardDescription>
          Historial completo de mensajes con compradores
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Search and Filters */}
        <div className='flex flex-col gap-4 sm:flex-row'>
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
            <Input
              placeholder='Buscar por comprador o Pack ID...'
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className='pl-8'
            />
          </div>

          <div className='flex gap-2'>
            <Select
              value={`${sortField}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split('-') as [
                  SortField,
                  SortOrder
                ];
                setSortField(field);
                setSortOrder(order);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className='w-48'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='date-desc'>Más recientes</SelectItem>
                <SelectItem value='date-asc'>Más antiguos</SelectItem>
                <SelectItem value='buyer-asc'>Comprador A-Z</SelectItem>
                <SelectItem value='buyer-desc'>Comprador Z-A</SelectItem>
                <SelectItem value='messages-desc'>Más mensajes</SelectItem>
                <SelectItem value='messages-asc'>Menos mensajes</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='5'>5 por página</SelectItem>
                <SelectItem value='10'>10 por página</SelectItem>
                <SelectItem value='20'>20 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className='text-muted-foreground flex gap-4 text-sm'>
          <span>Total: {filteredAndSortedThreads.length} conversaciones</span>
          <span>•</span>
          <span>
            Mostrando {paginatedThreads.length} de{' '}
            {filteredAndSortedThreads.length}
          </span>
        </div>

        {/* Messages List - UPDATED for new MessageThread interface */}
        {filteredAndSortedThreads.length === 0 ? (
          <div className='py-8 text-center'>
            <p className='text-muted-foreground'>
              No se encontraron conversaciones
            </p>
            <p className='text-muted-foreground mt-2 text-sm'>
              Intenta con otros términos de búsqueda
            </p>
          </div>
        ) : (
          <>
            <div className='space-y-6'>
              {paginatedThreads.map((thread) => {
                const threadKey = `${thread.pack_id}-${thread.buyer.id}`;
                const messagesToShow = getMessagesToShow(thread);
                const hasMoreMessages = thread.messages.length > 3;
                const showingAll = showMessageHistory[threadKey];

                return (
                  <Card
                    key={threadKey}
                    className='border-l-4 border-l-blue-500'
                  >
                    <CardHeader>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <CardTitle className='flex items-center gap-2'>
                            <User className='h-5 w-5' />
                            {thread.buyer.nickname}
                          </CardTitle>
                          <CardDescription className='mt-1 flex items-center gap-2'>
                            <Clock className='h-4 w-4' />
                            Pack #{thread.pack_id} •{' '}
                            {formatMessageDate(thread.lastMessageDate)}
                          </CardDescription>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            {getTimeAgo(thread.lastMessageDate)}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge variant='secondary'>
                            {thread.messages.length} mensaje
                            {thread.messages.length !== 1 ? 's' : ''}
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setSelectedThread(thread)}
                              >
                                <Eye className='h-4 w-4' />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className='max-h-[80vh] max-w-4xl overflow-y-auto'>
                              <DialogHeader>
                                <DialogTitle>
                                  Conversación con {thread.buyer.nickname}
                                </DialogTitle>
                                <DialogDescription>
                                  Pack #{thread.pack_id} •{' '}
                                  {thread.messages.length} mensaje
                                  {thread.messages.length !== 1 ? 's' : ''}
                                </DialogDescription>
                              </DialogHeader>
                              <div className='space-y-4'>
                                <div className='max-h-96 space-y-3 overflow-y-auto rounded border p-4'>
                                  {thread.messages.map((message) => (
                                    <div
                                      key={message.id}
                                      className={`rounded-lg p-3 ${
                                        message.from.user_id ===
                                          process.env
                                            .NEXT_PUBLIC_MERCADOLIBRE_SELLER_ID ||
                                        message.from.user_id === '1989560190'
                                          ? 'ml-8 border-l-4 border-blue-200 bg-blue-50'
                                          : 'mr-8 border-l-4 border-gray-200 bg-gray-50'
                                      }`}
                                    >
                                      <p className='text-sm'>
                                        {typeof message.text === 'string'
                                          ? message.text
                                          : message.text.plain ||
                                            'Sin contenido'}
                                      </p>
                                      <div className='mt-2 flex items-center gap-2'>
                                        <span className='text-muted-foreground text-xs'>
                                          {formatMessageDate(
                                            message.message_date.created
                                          )}
                                        </span>
                                        <Badge
                                          variant='outline'
                                          className='text-xs'
                                        >
                                          {message.from.user_id ===
                                            process.env
                                              .NEXT_PUBLIC_MERCADOLIBRE_SELLER_ID ||
                                          message.from.user_id === '1989560190'
                                            ? 'Tú'
                                            : thread.buyer.nickname}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <MessageReplyForm
                                  packId={thread.pack_id}
                                  buyerUserId={thread.buyer.id}
                                  recipientName={thread.buyer.nickname}
                                  placeholder='Responder al comprador...'
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='space-y-3'>
                        {messagesToShow.map((message) => (
                          <div
                            key={message.id}
                            className={`rounded-lg p-3 ${
                              message.from.user_id ===
                                process.env
                                  .NEXT_PUBLIC_MERCADOLIBRE_SELLER_ID ||
                              message.from.user_id === '1989560190'
                                ? 'ml-8 bg-blue-50'
                                : 'mr-8 bg-gray-50'
                            }`}
                          >
                            <p className='text-sm'>
                              {typeof message.text === 'string'
                                ? message.text
                                : message.text.plain || 'Sin contenido'}
                            </p>
                            <span className='text-muted-foreground text-xs'>
                              {formatMessageDate(message.message_date.created)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Show/Hide Message History Button */}
                      {hasMoreMessages && (
                        <div className='text-center'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => toggleMessageHistory(threadKey)}
                            className='text-blue-600 hover:text-blue-800'
                          >
                            {showingAll ? (
                              <>
                                Ocultar mensajes anteriores (
                                {thread.messages.length - 3} más)
                              </>
                            ) : (
                              <>
                                Ver todos los mensajes (
                                {thread.messages.length - 3} más)
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      <MessageReplyForm
                        packId={thread.pack_id}
                        buyerUserId={thread.buyer.id}
                        recipientName={thread.buyer.nickname}
                        placeholder='Responder al comprador...'
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between'>
                <div className='text-muted-foreground text-sm'>
                  Página {currentPage} de {totalPages}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className='h-4 w-4' />
                    Anterior
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
