
"use client"

import { useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { eachDayOfInterval, format, subDays, isSameDay, eachWeekOfInterval, eachMonthOfInterval, getWeek, getMonth, getYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useProfile } from '@/context/ProfileContext';

const chartConfig = {
  conversions: {
    label: 'Conversions',
    color: 'hsl(var(--chart-1))',
  },
  calculations: {
    label: 'Calculations',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function UsageTrendChart({ type = 'bar', period = 'weekly' }: { type: 'bar' | 'line' | 'area', period: 'weekly' | 'monthly' | 'yearly' }) {
  const { profile } = useProfile();
  const { activityLog } = profile;

  const data = useMemo(() => {
    const conversions = (activityLog || []).filter(item => item.type === 'conversion');
    const calculations = (activityLog || []).filter(item => item.type === 'calculator' || item.type === 'date_calculation');
    const today = new Date();

    if (period === 'weekly') {
      const days = eachDayOfInterval({ start: subDays(today, 6), end: today });
      return days.map(day => ({
        name: format(day, 'EEE'),
        conversions: conversions.filter(item => isSameDay(new Date(item.timestamp), day)).length,
        calculations: calculations.filter(item => isSameDay(new Date(item.timestamp), day)).length,
      }));
    }
    
    if (period === 'monthly') {
        const weeksInMonth = eachWeekOfInterval({
          start: startOfMonth(today),
          end: endOfMonth(today)
        });
        return weeksInMonth.map(weekStart => {
            const weekEnd = endOfWeek(weekStart);
            return {
                name: `Week ${getWeek(weekStart)}`,
                conversions: conversions.filter(item => isWithinInterval(new Date(item.timestamp), { start: weekStart, end: weekEnd })).length,
                calculations: calculations.filter(item => isWithinInterval(new Date(item.timestamp), { start: weekStart, end: weekEnd })).length,
            };
        });
    }

    if (period === 'yearly') {
        const monthsInYear = eachMonthOfInterval({
          start: startOfYear(today),
          end: endOfYear(today)
        });
        return monthsInYear.map(monthStart => {
            return {
                name: format(monthStart, 'MMM'),
                conversions: conversions.filter(item => getMonth(new Date(item.timestamp)) === getMonth(monthStart) && getYear(new Date(item.timestamp)) === getYear(monthStart)).length,
                calculations: calculations.filter(item => getMonth(new Date(item.timestamp)) === getMonth(monthStart) && getYear(new Date(item.timestamp)) === getYear(monthStart)).length,
            };
        });
    }

    return [];

  }, [activityLog, period]);

  const ChartComponent = useMemo(() => {
    switch(type) {
      case 'line': return LineChart;
      case 'area': return AreaChart;
      case 'bar': default: return BarChart;
    }
  }, [type]);

  const ChartSeries = useMemo(() => {
    switch(type) {
      case 'line':
        return (
          <>
            <Line dataKey="conversions" type="monotone" stroke="var(--color-conversions)" strokeWidth={2} dot={false} />
            <Line dataKey="calculations" type="monotone" stroke="var(--color-calculations)" strokeWidth={2} dot={false} />
          </>
        );
      case 'area':
         return (
          <>
            <defs>
                <linearGradient id="fillConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-conversions)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-conversions)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillCalculations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-calculations)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-calculations)" stopOpacity={0.1} />
                </linearGradient>
            </defs>
            <Area dataKey="conversions" type="monotone" stroke="var(--color-conversions)" fill="url(#fillConversions)" stackId="a" />
            <Area dataKey="calculations" type="monotone" stroke="var(--color-calculations)" fill="url(#fillCalculations)" stackId="a" />
          </>
        );
      case 'bar':
      default:
        return (
          <>
            <Bar dataKey="conversions" fill="var(--color-conversions)" radius={4} />
            <Bar dataKey="calculations" fill="var(--color-calculations)" radius={4} />
          </>
        );
    }
  }, [type]);

  if (!activityLog || activityLog.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data to display.</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ChartComponent data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => value.slice(0, 3)} />
        <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
        {ChartSeries}
      </ChartComponent>
    </ChartContainer>
  );
}
