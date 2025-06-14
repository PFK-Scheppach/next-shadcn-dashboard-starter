'use client';

import { IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

export interface AreaGraphData {
  month: string;
  woocommerce: number;
  mercadolibre: number;
}

const fallbackData: AreaGraphData[] = Array.from({ length: 6 }).map((_, i) => ({
  month: new Date(
    new Date().getFullYear(),
    new Date().getMonth() - (5 - i)
  ).toLocaleDateString('en-US', { month: 'long' }),
  woocommerce: Math.round(Math.random() * 500),
  mercadolibre: Math.round(Math.random() * 500)
}));

const chartConfig = {
  woocommerce: {
    label: 'WooCommerce',
    color: 'var(--primary)'
  },
  mercadolibre: {
    label: 'MercadoLibre',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function AreaGraph({ data }: { data?: AreaGraphData[] }) {
  const chartData = data && data.length > 0 ? data : fallbackData;
  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Area Chart - Stacked</CardTitle>
        <CardDescription>
          Showing total visitors for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillWoo' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-woocommerce)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-woocommerce)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillML' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-mercadolibre)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-mercadolibre)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='mercadolibre'
              type='natural'
              fill='url(#fillML)'
              stroke='var(--color-mercadolibre)'
              stackId='a'
            />
            <Area
              dataKey='woocommerce'
              type='natural'
              fill='url(#fillWoo)'
              stroke='var(--color-woocommerce)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              Trending up by 5.2% this month{' '}
              <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              January - June 2024
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
