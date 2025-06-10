'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  MessageSquare,
  Eye,
  DollarSign,
  Calendar,
  User,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';
import { MercadoLibreOrder } from '@/lib/mercadolibre';

interface EnhancedMercadoLibreOrderListProps {
  orders: MercadoLibreOrder[];
}

type SortField = 'date' | 'amount' | 'buyer';
type SortOrder = 'asc' | 'desc';

export function EnhancedMercadoLibreOrderList({
  orders
}: EnhancedMercadoLibreOrderListProps) {
  const [selectedOrder, setSelectedOrder] = useState<MercadoLibreOrder | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [trackingInfo, setTrackingInfo] = useState<{
    orderId: number;
    status?: string;
    trackingNumber?: string;
  } | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

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

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(
      (order) =>
        order.buyer.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm)
    );

    // Sort orders
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison =
            new Date(a.date_created).getTime() -
            new Date(b.date_created).getTime();
          break;
        case 'amount':
          comparison = a.total_amount - b.total_amount;
          break;
        case 'buyer':
          comparison = a.buyer.nickname.localeCompare(b.buyer.nickname);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [orders, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOrders.length / pageSize);
  const paginatedOrders = filteredAndSortedOrders.slice(
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

  const handleSendMessage = async (orderId: number) => {
    window.location.href = `/dashboard/mercadolibre/messages?order=${orderId}`;
  };

  const handleTrackOrder = async (orderId: number) => {
    try {
      const res = await fetch(`/api/mercadolibre/tracking/${orderId}`);
      const data = await res.json();
      if (res.ok) {
        setTrackingInfo({ orderId, ...data });
      } else {
        setTrackingInfo({ orderId, status: 'No disponible' });
      }
    } catch (error) {
      console.error('Error fetching tracking info:', error);
      setTrackingInfo({ orderId, status: 'Error' });
    }
  };

  const statusMap: Record<string, string> = {
    handling: 'Preparándose',
    ready_to_ship: 'Listo para enviar',
    shipped: 'En camino',
    delivered: 'Entregado',
    not_delivered: 'No entregado'
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'Sin información';
    return statusMap[status] || status;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ArrowUpDown className='h-4 w-4 opacity-50' />;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Órdenes de MercadoLibre
          </CardTitle>
          <CardDescription>
            Gestiona y consulta todas las órdenes recibidas desde MercadoLibre
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Filters and Search */}
          <div className='flex flex-col gap-4 sm:flex-row'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
              <Input
                placeholder='Buscar por comprador o ID de orden...'
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className='pl-8'
              />
            </div>

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

          {/* Stats */}
          <div className='text-muted-foreground flex gap-4 text-sm'>
            <span>Total: {filteredAndSortedOrders.length} órdenes</span>
            <span>•</span>
            <span>
              Mostrando {paginatedOrders.length} de{' '}
              {filteredAndSortedOrders.length}
            </span>
          </div>

          {/* Orders Table */}
          {filteredAndSortedOrders.length === 0 ? (
            <div className='py-8 text-center'>
              <p className='text-muted-foreground'>
                {orders.length === 0
                  ? 'No hay órdenes disponibles'
                  : 'No se encontraron órdenes'}
              </p>
              <p className='text-muted-foreground mt-2 text-sm'>
                {orders.length === 0
                  ? 'Las órdenes aparecerán aquí cuando se configuren las credenciales de MercadoLibre'
                  : 'Intenta con otros términos de búsqueda'}
              </p>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden ID</TableHead>
                      <TableHead>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 p-0'
                          onClick={() => handleSort('buyer')}
                        >
                          Comprador {getSortIcon('buyer')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 p-0'
                          onClick={() => handleSort('date')}
                        >
                          Fecha {getSortIcon('date')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 p-0'
                          onClick={() => handleSort('amount')}
                        >
                          Total {getSortIcon('amount')}
                        </Button>
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className='font-medium'>
                          <div>
                            <span className='font-mono'>#{order.id}</span>
                            {order.pack_id && (
                              <div className='text-muted-foreground text-xs'>
                                Pack: {order.pack_id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <User className='text-muted-foreground h-4 w-4' />
                            {order.buyer.nickname}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className='font-medium'>
                              {formatDate(order.date_created)}
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              {getTimeAgo(order.date_created)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='font-semibold text-green-600'>
                            {formatCurrency(order.total_amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>
                            {getStatusLabel(order.shipping?.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <Eye className='h-4 w-4' />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className='max-w-2xl'>
                                <DialogHeader>
                                  <DialogTitle>
                                    Detalles de la Orden #{order.id}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Información completa de la orden de
                                    MercadoLibre
                                  </DialogDescription>
                                </DialogHeader>
                                <div className='grid gap-4'>
                                  <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='space-y-2'>
                                      <h4 className='flex items-center gap-2 font-semibold'>
                                        <User className='h-4 w-4' />
                                        Comprador
                                      </h4>
                                      <p className='text-lg'>
                                        {order.buyer.nickname}
                                      </p>
                                    </div>
                                    <div className='space-y-2'>
                                      <h4 className='flex items-center gap-2 font-semibold'>
                                        <Calendar className='h-4 w-4' />
                                        Fecha de Creación
                                      </h4>
                                      <p>{formatDate(order.date_created)}</p>
                                      <p className='text-muted-foreground text-sm'>
                                        {getTimeAgo(order.date_created)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className='space-y-2'>
                                    <h4 className='flex items-center gap-2 font-semibold'>
                                      <DollarSign className='h-4 w-4' />
                                      Total
                                    </h4>
                                    <p className='text-2xl font-bold text-green-600'>
                                      {formatCurrency(order.total_amount)}
                                    </p>
                                  </div>

                                  {order.pack_id && (
                                    <div className='space-y-2'>
                                      <h4 className='font-semibold'>Pack ID</h4>
                                      <p className='bg-muted rounded px-2 py-1 font-mono text-sm'>
                                        {order.pack_id}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleTrackOrder(order.id)}
                            >
                              <Package className='h-4 w-4' />
                            </Button>

                            {order.pack_id && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleSendMessage(order.id)}
                              >
                                <MessageSquare className='h-4 w-4' />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
      {trackingInfo && (
        <Dialog
          open={!!trackingInfo}
          onOpenChange={(o) => !o && setTrackingInfo(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tracking Orden #{trackingInfo.orderId}</DialogTitle>
              <DialogDescription>
                Estado: {getStatusLabel(trackingInfo.status)}
              </DialogDescription>
            </DialogHeader>
            {trackingInfo.trackingNumber && (
              <div className='flex items-center gap-2'>
                <span className='font-mono'>{trackingInfo.trackingNumber}</span>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
