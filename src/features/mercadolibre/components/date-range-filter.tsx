'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { getCurrentMonthRange, getCurrentDate } from '@/lib/mercadolibre';

interface DateRangeFilterProps {
  onDateRangeChange: (
    fromDate?: string,
    toDate?: string,
    label?: string
  ) => void;
  isLoading?: boolean;
}

export function DateRangeFilter({
  onDateRangeChange,
  isLoading
}: DateRangeFilterProps) {
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [selectedRange, setSelectedRange] = useState('current-month');

  const currentMonth = getCurrentMonthRange();
  const currentDate = getCurrentDate();

  const handleQuickSelect = (range: string) => {
    setSelectedRange(range);
    const now = currentDate;

    switch (range) {
      case 'current-month':
        onDateRangeChange(
          currentMonth.from,
          currentMonth.to,
          currentMonth.monthName
        );
        break;
      case 'last-month': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59
        );
        const monthName = lastMonth.toLocaleDateString('es-ES', {
          month: 'long',
          year: 'numeric'
        });
        onDateRangeChange(
          lastMonth.toISOString(),
          lastMonthEnd.toISOString(),
          `Mes anterior (${monthName})`
        );
        break;
      }
      case 'last-3-months': {
        const threeMonthsAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 2,
          1
        );
        onDateRangeChange(
          threeMonthsAgo.toISOString(),
          currentMonth.to,
          'Últimos 3 meses'
        );
        break;
      }
      case 'last-6-months': {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        onDateRangeChange(
          sixMonthsAgo.toISOString(),
          currentMonth.to,
          'Últimos 6 meses'
        );
        break;
      }
      case 'this-year': {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        onDateRangeChange(
          yearStart.toISOString(),
          currentMonth.to,
          `Año ${now.getFullYear()}`
        );
        break;
      }
      case 'all-time':
        onDateRangeChange(undefined, undefined, 'Todos los tiempos');
        break;
      default:
        break;
    }
  };

  const handleCustomRange = () => {
    if (customFromDate && customToDate) {
      const fromDate = new Date(customFromDate);
      const toDate = new Date(customToDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      const label = `${fromDate.toLocaleDateString('es-ES')} - ${toDate.toLocaleDateString('es-ES')}`;
      onDateRangeChange(fromDate.toISOString(), toDate.toISOString(), label);
      setSelectedRange('custom');
    }
  };

  const getCurrentRangeLabel = () => {
    switch (selectedRange) {
      case 'current-month':
        return currentMonth.monthName;
      case 'last-month':
        return 'Mes anterior';
      case 'last-3-months':
        return 'Últimos 3 meses';
      case 'last-6-months':
        return 'Últimos 6 meses';
      case 'this-year':
        return `Año ${currentDate.getFullYear()}`;
      case 'all-time':
        return 'Todos los tiempos';
      case 'custom':
        return 'Rango personalizado';
      default:
        return 'Seleccionar período';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Calendar className='h-5 w-5' />
          Filtro de Fechas
          <Badge variant='outline' className='ml-auto'>
            <Clock className='mr-1 h-3 w-3' />
            {getCurrentRangeLabel()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Quick Select Options */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Períodos predefinidos:</label>
          <Select value={selectedRange} onValueChange={handleQuickSelect}>
            <SelectTrigger>
              <SelectValue placeholder='Seleccionar período' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='current-month'>
                📅 Mes actual ({currentMonth.monthName})
              </SelectItem>
              <SelectItem value='last-month'>📆 Mes anterior</SelectItem>
              <SelectItem value='last-3-months'>📊 Últimos 3 meses</SelectItem>
              <SelectItem value='last-6-months'>📈 Últimos 6 meses</SelectItem>
              <SelectItem value='this-year'>
                🗓️ Este año ({currentDate.getFullYear()})
              </SelectItem>
              <SelectItem value='all-time'>⏰ Todos los tiempos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Rango personalizado:</label>
          <div className='flex gap-2'>
            <div className='flex-1'>
              <Input
                type='date'
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                placeholder='Fecha desde'
              />
            </div>
            <div className='flex-1'>
              <Input
                type='date'
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                placeholder='Fecha hasta'
              />
            </div>
            <Button
              onClick={handleCustomRange}
              disabled={!customFromDate || !customToDate || isLoading}
              size='sm'
            >
              {isLoading ? (
                <RefreshCw className='h-4 w-4 animate-spin' />
              ) : (
                'Aplicar'
              )}
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className='text-muted-foreground bg-muted rounded p-2 text-xs'>
          💡 Por defecto se muestran solo las órdenes del mes actual para
          optimizar el rendimiento de la API.
        </div>
      </CardContent>
    </Card>
  );
}
