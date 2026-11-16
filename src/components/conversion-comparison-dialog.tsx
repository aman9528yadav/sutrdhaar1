
"use client";

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy } from 'lucide-react';
import { CATEGORIES, convert, Unit } from '@/lib/units';
import { useToast } from '@/hooks/use-toast';

interface ConversionComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  fromUnit: string;
  fromUnitDetails: Unit;
  inputValue: string;
}

export function ConversionComparisonDialog({
  open,
  onOpenChange,
  category,
  fromUnit,
  fromUnitDetails,
  inputValue,
}: ConversionComparisonDialogProps) {
  const { toast } = useToast();
  const value = parseFloat(inputValue);

  const comparisonData = useMemo(() => {
    if (isNaN(value)) return [];

    const activeCategory = CATEGORIES.find((c) => c.name === category);
    if (!activeCategory) return [];

    return activeCategory.units
      .filter((unit) => unit.name !== fromUnit)
      .map((toUnit) => {
        const convertedValue = convert(value, fromUnit, toUnit.name, category);
        const displayValue =
          convertedValue !== null
            ? Number(convertedValue.toPrecision(5))
            : 0;
        return {
          name: toUnit.name,
          symbol: toUnit.symbol,
          value: displayValue,
        };
      })
      .sort((a, b) => a.value - b.value);
  }, [value, fromUnit, category]);

  const handleCopyAll = () => {
    const textToCopy = comparisonData
      .map((item) => `${item.name}: ${item.value} ${item.symbol}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    toast({ title: 'Copied all conversions to clipboard!' });
  };
  
  // To handle very large differences in values for the chart
  const chartData = useMemo(() => {
    if(comparisonData.length === 0) return [];
    
    const maxValue = Math.max(...comparisonData.map(d => d.value));

    // Simple log scale for visualization if values differ greatly
    const isLogScaleNeeded = maxValue > 1000 && Math.min(...comparisonData.map(d => d.value)) < 1;

    if (isLogScaleNeeded) {
        return comparisonData.map(d => ({
            ...d,
            chartValue: d.value > 0 ? Math.log10(d.value + 1) : 0,
        }));
    }

    return comparisonData.map(d => ({ ...d, chartValue: d.value }));

  }, [comparisonData]);

  if (isNaN(value)) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Conversion Comparison</DialogTitle>
          <DialogDescription>
            Comparing {inputValue} {fromUnitDetails.symbol} to other units in the{' '}
            {category} category.
          </DialogDescription>
        </DialogHeader>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--accent))' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <p className="text-sm font-medium">{`${payload[0].payload.name}: ${payload[0].payload.value}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="chartValue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                 <LabelList dataKey="value" position="right" offset={10} style={{ fontSize: '12px', fill: 'hsl(var(--foreground))' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <ScrollArea className="h-[150px] rounded-md border p-2">
          <div className="space-y-2">
            {comparisonData.map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center bg-accent/50 p-2 rounded-md text-sm"
              >
                <div>
                  <span className="font-medium text-accent-foreground">{item.name}</span>
                  <span className="text-muted-foreground ml-2">{item.symbol}</span>
                </div>
                <span className="font-semibold text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button onClick={handleCopyAll} className="w-full">
          <Copy className="mr-2 h-4 w-4" />
          Copy All
        </Button>
      </DialogContent>
    </Dialog>
  );
}
