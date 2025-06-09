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
  HelpCircle,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { EnhancedQuestionsList } from '@/features/mercadolibre/components/enhanced-questions-list';
import { DateRangeFilter } from '@/features/mercadolibre/components/date-range-filter';
import {
  getUnansweredCount,
  getQuestionStatusColor,
  getQuestionStatusText,
  type QuestionWithStatus
} from '@/features/mercadolibre/utils/questions';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async (fromDate?: Date, toDate?: Date) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate && toDate) {
        params.set('from', fromDate.toISOString());
        params.set('to', toDate.toISOString());
      }
      const res = await fetch(
        `/api/mercadolibre/questions?${params.toString()}`
      );
      const json = await res.json();
      setQuestions(json.questions || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      setQuestions([]);
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
    loadQuestions(from, to);
  };

  const unansweredCount = getUnansweredCount(questions);
  const answeredCount = questions.length - unansweredCount;
  const responseRate =
    questions.length > 0
      ? ((answeredCount / questions.length) * 100).toFixed(1)
      : '0';

  // Recent questions (last 7 days)
  const recentQuestions = questions.filter((question) => {
    const questionDate = new Date(question.date_created);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return questionDate >= sevenDaysAgo;
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex-1 space-y-6'>
          <Heading
            title='Preguntas MercadoLibre'
            description='Responde las preguntas de tus compradores y mantén una alta tasa de respuesta'
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
          title='Preguntas MercadoLibre'
          description='Responde las preguntas de tus compradores y mantén una alta tasa de respuesta'
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
            {questions.length} pregunta{questions.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Preguntas
              </CardTitle>
              <HelpCircle className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{questions.length}</div>
              <p className='text-muted-foreground text-xs'>
                Todas las preguntas recibidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Sin Responder
              </CardTitle>
              <AlertCircle className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-600'>
                {unansweredCount}
              </div>
              <p className='text-muted-foreground text-xs'>
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Respondidas</CardTitle>
              <CheckCircle className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-600'>
                {answeredCount}
              </div>
              <p className='text-muted-foreground text-xs'>
                Preguntas resueltas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Tasa Respuesta
              </CardTitle>
              <TrendingUp className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{responseRate}%</div>
              <p className='text-muted-foreground text-xs'>
                Porcentaje respondido
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Urgent Alert */}
        {unansweredCount > 0 && (
          <>
            <Card className='border-l-4 border-l-red-500 bg-red-50/50'>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-2'>
                  <AlertCircle className='h-5 w-5 text-red-600' />
                  <span className='font-semibold text-red-800'>
                    Tienes {unansweredCount} pregunta
                    {unansweredCount !== 1 ? 's' : ''} sin responder
                  </span>
                </div>
                <p className='mt-2 text-sm text-red-700'>
                  Responder rápidamente mejora tu reputación como vendedor en
                  MercadoLibre
                </p>
              </CardContent>
            </Card>

            <Separator />
          </>
        )}

        {/* Recent Activity */}
        {recentQuestions.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5' />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>
                  Preguntas recibidas en los últimos 7 días
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {recentQuestions.slice(0, 3).map((question) => (
                    <div
                      key={question.id}
                      className='flex items-center justify-between rounded-lg border p-3'
                    >
                      <div className='flex items-center gap-3'>
                        <User className='text-muted-foreground h-5 w-5' />
                        <div>
                          <p className='font-medium'>
                            {question.from.nickname}
                          </p>
                          <p className='text-muted-foreground max-w-md truncate text-sm'>
                            {question.text}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <Badge className={getQuestionStatusColor(question)}>
                          {getQuestionStatusText(question)}
                        </Badge>
                        <p className='text-muted-foreground mt-1 text-xs'>
                          {question.timeAgo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {recentQuestions.length > 3 && (
                  <div className='mt-4 text-center'>
                    <p className='text-muted-foreground text-sm'>
                      Y {recentQuestions.length - 3} pregunta
                      {recentQuestions.length - 3 !== 1 ? 's' : ''} más esta
                      semana
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />
          </>
        )}

        {/* Enhanced Questions List */}
        <EnhancedQuestionsList initialQuestions={questions} />
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
