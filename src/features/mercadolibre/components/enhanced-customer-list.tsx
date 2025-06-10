'use client';

import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  ArrowUpDown,
  User,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { MercadoLibreCustomer } from '../utils/customers';

interface EnhancedCustomerListProps {
  customers: MercadoLibreCustomer[];
}

type SortField = 'name' | 'orders' | 'spent';
type SortOrder = 'asc' | 'desc';

export function EnhancedCustomerList({ customers }: EnhancedCustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('spent');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCustomer, setSelectedCustomer] =
    useState<MercadoLibreCustomer | null>(null);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);

  const filtered = useMemo(() => {
    let data = customers.filter((c) =>
      c.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    data.sort((a, b) => {
      let comp = 0;
      switch (sortField) {
        case 'name':
          comp = a.nickname.localeCompare(b.nickname);
          break;
        case 'orders':
          comp = a.orderCount - b.orderCount;
          break;
        case 'spent':
          comp = a.totalSpent - b.totalSpent;
          break;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return data;
  }, [customers, searchTerm, sortField, sortOrder]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field: SortField) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <User className='h-5 w-5' />
          Clientes
        </CardTitle>
        <CardDescription>Lista de clientes de MercadoLibre</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-col gap-4 sm:flex-row'>
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
            <Input
              placeholder='Buscar por cliente...'
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
        <div className='text-muted-foreground flex gap-4 text-sm'>
          <span>Total: {filtered.length} clientes</span>
          <span>•</span>
          <span>
            Mostrando {paginated.length} de {filtered.length}
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className='py-8 text-center'>
            <p className='text-muted-foreground'>No se encontraron clientes</p>
          </div>
        ) : (
          <>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 p-0'
                        onClick={() => toggleSort('name')}
                      >
                        Cliente {getSortIcon('name')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 p-0'
                        onClick={() => toggleSort('orders')}
                      >
                        Órdenes {getSortIcon('orders')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 p-0'
                        onClick={() => toggleSort('spent')}
                      >
                        Gastado {getSortIcon('spent')}
                      </Button>
                    </TableHead>
                    <TableHead>Última compra</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((c) => (
                    <TableRow key={c.nickname}>
                      <TableCell className='font-medium'>
                        {c.nickname}
                      </TableCell>
                      <TableCell>{c.orderCount}</TableCell>
                      <TableCell>{formatCurrency(c.totalSpent)}</TableCell>
                      <TableCell>{formatDate(c.lastPurchase)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => setSelectedCustomer(c)}
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className='max-w-xl'>
                            <DialogHeader>
                              <DialogTitle>
                                Compras de {selectedCustomer?.nickname}
                              </DialogTitle>
                              <DialogDescription>
                                Historial de órdenes
                              </DialogDescription>
                            </DialogHeader>
                            <div className='space-y-3'>
                              {selectedCustomer?.orders.map((o) => (
                                <div
                                  key={o.id}
                                  className='flex items-center justify-between rounded-md border p-2'
                                >
                                  <div>
                                    <span className='font-mono'>#{o.id}</span>
                                    <div className='text-muted-foreground text-xs'>
                                      {formatDate(o.date_created)}
                                    </div>
                                  </div>
                                  <div className='font-semibold'>
                                    {formatCurrency(o.total_amount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className='flex items-center justify-between'>
                <div className='text-muted-foreground text-sm'>
                  Página {currentPage} de {totalPages}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className='h-4 w-4' /> Anterior
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Siguiente <ChevronRight className='h-4 w-4' />
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
