'use client';

import React, { useState, useMemo } from 'react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  HelpCircle,
  Clock,
  User,
  Search,
  Filter,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Reply,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Question {
  id: number;
  text: string;
  status: string;
  date_created: string;
  from: {
    id: string;
    nickname: string;
  };
  answer?: {
    text: string;
    date_created: string;
  };
  item_id: string;
  isAnswered: boolean;
  timeAgo: string;
}

interface EnhancedQuestionsListProps {
  initialQuestions: Question[];
}

type SortField = 'date' | 'status' | 'buyer';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'answered' | 'unanswered' | 'urgent';

export function EnhancedQuestionsList({
  initialQuestions
}: EnhancedQuestionsListProps) {
  const [questions] = useState<Question[]>(initialQuestions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [replyText, setReplyText] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set()
  );

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${Math.floor(diffInMinutes)} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    const days = Math.floor(diffInMinutes / 1440);
    return `Hace ${days}d`;
  };

  const isUrgent = (dateString: string) => {
    const hoursSince =
      (new Date().getTime() - new Date(dateString).getTime()) /
      (1000 * 60 * 60);
    return hoursSince > 24;
  };

  // Filter and sort questions
  const filteredAndSortedQuestions = useMemo(() => {
    let filtered = questions.filter((question) => {
      const matchesSearch =
        (question.from?.nickname || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (question.text || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        question.id.toString().includes(searchTerm);

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'answered' && question.isAnswered) ||
        (filterStatus === 'unanswered' && !question.isAnswered) ||
        (filterStatus === 'urgent' &&
          !question.isAnswered &&
          isUrgent(question.date_created));

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison =
            new Date(a.date_created).getTime() -
            new Date(b.date_created).getTime();
          break;
        case 'buyer':
          comparison = (a.from?.nickname || '').localeCompare(
            b.from?.nickname || ''
          );
          break;
        case 'status':
          comparison = Number(a.isAnswered) - Number(b.isAnswered);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [questions, searchTerm, filterStatus, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedQuestions.length / pageSize);
  const paginatedQuestions = filteredAndSortedQuestions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusCounts = () => {
    const answered = questions.filter((q) => q.isAnswered).length;
    const unanswered = questions.filter((q) => !q.isAnswered).length;
    const urgent = questions.filter(
      (q) => !q.isAnswered && isUrgent(q.date_created)
    ).length;
    return { answered, unanswered, urgent };
  };

  const {
    answered: answeredCount,
    unanswered: unansweredCount,
    urgent: urgentCount
  } = getStatusCounts();

  const toggleExpanded = (questionId: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getStatusBadge = (question: Question) => {
    if (question.isAnswered) {
      return (
        <Badge
          variant='default'
          className='border-green-200 bg-green-100 text-green-800'
        >
          <CheckCircle className='mr-1 h-3 w-3' />
          Respondida
        </Badge>
      );
    }

    if (isUrgent(question.date_created)) {
      return (
        <Badge
          variant='destructive'
          className='border-red-200 bg-red-100 text-red-800'
        >
          <AlertTriangle className='mr-1 h-3 w-3' />
          Urgente
        </Badge>
      );
    }

    return (
      <Badge
        variant='secondary'
        className='border-yellow-200 bg-yellow-100 text-yellow-800'
      >
        <Clock className='mr-1 h-3 w-3' />
        Pendiente
      </Badge>
    );
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-16'>
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'>
            <HelpCircle className='h-8 w-8 text-blue-600' />
          </div>
          <h3 className='mb-2 text-xl font-semibold'>No hay preguntas</h3>
          <p className='text-muted-foreground max-w-md text-center'>
            Cuando los compradores envíen preguntas sobre tus productos,
            aparecerán aquí para que puedas responderlas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with stats */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card className='border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-blue-600'>Total</p>
                <p className='text-2xl font-bold text-blue-900'>
                  {questions.length}
                </p>
              </div>
              <HelpCircle className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-yellow-600'>
                  Pendientes
                </p>
                <p className='text-2xl font-bold text-yellow-900'>
                  {unansweredCount}
                </p>
              </div>
              <Clock className='h-8 w-8 text-yellow-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-red-200 bg-gradient-to-r from-red-50 to-red-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-red-600'>Urgentes</p>
                <p className='text-2xl font-bold text-red-900'>{urgentCount}</p>
              </div>
              <AlertTriangle className='h-8 w-8 text-red-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-green-200 bg-gradient-to-r from-green-50 to-green-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-green-600'>
                  Respondidas
                </p>
                <p className='text-2xl font-bold text-green-900'>
                  {answeredCount}
                </p>
              </div>
              <CheckCircle className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            Gestión de Preguntas
          </CardTitle>
          <CardDescription>
            Responde a las preguntas de tus compradores y mantén una alta tasa
            de respuesta
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col gap-4 lg:flex-row'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
              <Input
                placeholder='Buscar por comprador, pregunta o ID...'
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className='pl-10'
              />
            </div>

            <div className='flex gap-2'>
              <Select
                value={filterStatus}
                onValueChange={(value: FilterStatus) => {
                  setFilterStatus(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className='w-48'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>
                    Todas ({questions.length})
                  </SelectItem>
                  <SelectItem value='unanswered'>
                    Pendientes ({unansweredCount})
                  </SelectItem>
                  <SelectItem value='urgent'>
                    Urgentes ({urgentCount})
                  </SelectItem>
                  <SelectItem value='answered'>
                    Respondidas ({answeredCount})
                  </SelectItem>
                </SelectContent>
              </Select>

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
                  <SelectItem value='status-asc'>Pendientes primero</SelectItem>
                  <SelectItem value='status-desc'>
                    Respondidas primero
                  </SelectItem>
                  <SelectItem value='buyer-asc'>Comprador A-Z</SelectItem>
                  <SelectItem value='buyer-desc'>Comprador Z-A</SelectItem>
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
                  <SelectItem value='50'>50 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results info */}
          <div className='text-muted-foreground flex items-center justify-between text-sm'>
            <span>
              Mostrando {paginatedQuestions.length} de{' '}
              {filteredAndSortedQuestions.length} preguntas
            </span>
            {filteredAndSortedQuestions.length > 0 && (
              <div className='flex gap-4'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className='flex items-center px-2'>
                  {currentPage} de {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {filteredAndSortedQuestions.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
              <Search className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='mb-2 text-lg font-semibold'>
              No se encontraron preguntas
            </h3>
            <p className='text-muted-foreground'>
              Intenta con otros términos de búsqueda o filtros diferentes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {paginatedQuestions.map((question) => {
            const isExpanded = expandedQuestions.has(question.id);
            return (
              <Card
                key={question.id}
                className={`transition-all duration-200 hover:shadow-md ${
                  !question.isAnswered ? 'border-l-4 border-l-yellow-400' : ''
                } ${isUrgent(question.date_created) && !question.isAnswered ? 'border-l-red-400' : ''}`}
              >
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='mb-2 flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                          <User className='h-5 w-5 text-blue-600' />
                        </div>
                        <div>
                          <CardTitle className='text-base'>
                            {question.from?.nickname || 'Usuario Desconocido'}
                          </CardTitle>
                          <CardDescription className='flex items-center gap-2'>
                            <Calendar className='h-3 w-3' />
                            {getTimeAgo(question.date_created)} • ID:{' '}
                            {question.id}
                          </CardDescription>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      {getStatusBadge(question)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className='pt-0'>
                  <div className='space-y-4'>
                    <div className='rounded-lg bg-gray-50 p-4'>
                      <p className='text-sm leading-relaxed text-gray-700'>
                        {question.text}
                      </p>
                    </div>

                    {question.answer && (
                      <div className='rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4'>
                        <div className='mb-2 flex items-center gap-2'>
                          <Badge variant='outline' className='text-xs'>
                            Tu respuesta
                          </Badge>
                          <span className='text-muted-foreground text-xs'>
                            {getTimeAgo(question.answer.date_created)}
                          </span>
                        </div>
                        <p className='text-sm text-gray-700'>
                          {question.answer.text}
                        </p>
                      </div>
                    )}

                    {!question.isAnswered && (
                      <div className='flex gap-2'>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant='default'
                              size='sm'
                              className='flex items-center gap-2'
                            >
                              <Reply className='h-4 w-4' />
                              Responder
                            </Button>
                          </DialogTrigger>
                          <DialogContent className='sm:max-w-md'>
                            <DialogHeader>
                              <DialogTitle>Responder Pregunta</DialogTitle>
                              <DialogDescription>
                                Pregunta de{' '}
                                {question.from?.nickname || 'Usuario'}
                              </DialogDescription>
                            </DialogHeader>
                            <div className='space-y-4'>
                              <div className='rounded-lg bg-gray-50 p-3'>
                                <p className='text-sm text-gray-700'>
                                  {question.text}
                                </p>
                              </div>
                              <Textarea
                                placeholder='Escribe tu respuesta...'
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={4}
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant='outline'
                                onClick={() => setReplyText('')}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => {
                                  // Handle reply logic here
                                  console.log(
                                    'Replying to question',
                                    question.id,
                                    'with:',
                                    replyText
                                  );
                                  setReplyText('');
                                }}
                                disabled={!replyText.trim()}
                              >
                                Enviar Respuesta
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
