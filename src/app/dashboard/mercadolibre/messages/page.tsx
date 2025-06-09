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
import {
  MessageCircle,
  Clock,
  User,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import { EnhancedMessagesList } from '@/features/mercadolibre/components/enhanced-messages-list';
import { DateRangeFilter } from '@/features/mercadolibre/components/date-range-filter';
import {
  formatMessageDate,
  type MessageThread
} from '@/features/mercadolibre/utils/messages';

export default function MessagesPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async (fromDate?: Date, toDate?: Date) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate && toDate) {
        params.set('from', fromDate.toISOString());
        params.set('to', toDate.toISOString());
      }
      const res = await fetch(`/api/mercadolibre/threads?${params.toString()}`);
      const json = await res.json();
      setThreads(json.threads || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (
    fromDate?: string,
    toDate?: string,
    label?: string
  ) => {
    const from = fromDate ? new Date(fromDate) : undefined;
    const to = toDate ? new Date(toDate) : undefined;

    setDateRange({ from, to });
    setSelectedPeriod(label || 'custom');
    loadMessages(from, to);
  };

  // Calculate stats
  const totalMessages = threads.reduce(
    (acc, thread) => acc + thread.messages.length,
    0
  );
  const activeConversations = threads.filter(
    (thread) =>
      new Date().getTime() - new Date(thread.lastMessageDate).getTime() <
      7 * 24 * 60 * 60 * 1000
  ).length;
  const uniqueBuyers = new Set(threads.map((thread) => thread.buyerUserId))
    .size;

  // Get recent activity
  const recentThreads = threads
    .sort(
      (a, b) =>
        new Date(b.lastMessageDate).getTime() -
        new Date(a.lastMessageDate).getTime()
    )
    .slice(0, 3);

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex-1 space-y-6'>
          <Heading
            title='Mensajes MercadoLibre'
            description='Gestiona las conversaciones con tus compradores y revisa el historial completo'
          />
          <LoadingSkeleton />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex-1 space-y-6'>
        <Heading
          title='Mensajes MercadoLibre'
          description='Gestiona las conversaciones con tus compradores y revisa el historial completo'
        />

        {/* Date Range Filter */}
        <DateRangeFilter
          onDateRangeChange={handleDateRangeChange}
          isLoading={isLoading}
        />

        {/* Filter Status Badge */}
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            {selectedPeriod === 'current-month'
              ? 'Mes actual'
              : selectedPeriod === 'all-time'
                ? 'Todo el tiempo'
                : 'Período personalizado'}
          </Badge>
          <Badge variant='secondary'>
            {threads.length} conversacion{threads.length !== 1 ? 'es' : ''}
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Mensajes
              </CardTitle>
              <MessageCircle className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{totalMessages}</div>
              <p className='text-muted-foreground text-xs'>
                En todas las conversaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Conversaciones
              </CardTitle>
              <TrendingUp className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{threads.length}</div>
              <p className='text-muted-foreground text-xs'>
                Total de hilos de conversación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Activas (7 días)
              </CardTitle>
              <Clock className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{activeConversations}</div>
              <p className='text-muted-foreground text-xs'>
                Conversaciones recientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Compradores</CardTitle>
              <Users className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{uniqueBuyers}</div>
              <p className='text-muted-foreground text-xs'>
                Compradores únicos
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Recent Activity */}
        {recentThreads.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5' />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>
                  Últimas conversaciones con actividad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {recentThreads.map((thread) => (
                    <div
                      key={`${thread.packId}-${thread.buyerUserId}`}
                      className='flex items-center justify-between rounded-lg border p-3'
                    >
                      <div className='flex items-center gap-3'>
                        <User className='text-muted-foreground h-5 w-5' />
                        <div>
                          <p className='font-medium'>{thread.buyerNickname}</p>
                          <p className='text-muted-foreground text-sm'>
                            Pack #{thread.packId}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <Badge variant='secondary'>
                          {thread.messages.length} mensaje
                          {thread.messages.length !== 1 ? 's' : ''}
                        </Badge>
                        <p className='text-muted-foreground mt-1 text-xs'>
                          {formatMessageDate(thread.lastMessageDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Separator />
          </>
        )}

        {/* Enhanced Messages List */}
        <EnhancedMessagesList initialThreads={threads} />
      </div>
    </PageContainer>
  );
}

function LoadingSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Stats Skeleton */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader className='space-y-0 pb-2'>
              <div className='bg-muted h-4 w-24 rounded'></div>
            </CardHeader>
            <CardContent>
              <div className='bg-muted mb-2 h-8 w-16 rounded'></div>
              <div className='bg-muted h-3 w-32 rounded'></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader>
              <div className='bg-muted h-6 w-1/3 rounded'></div>
              <div className='bg-muted h-4 w-1/2 rounded'></div>
            </CardHeader>
            <CardContent>
              <div className='bg-muted h-32 rounded'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
