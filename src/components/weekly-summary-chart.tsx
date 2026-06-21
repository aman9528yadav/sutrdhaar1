
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useProfile } from '@/context/ProfileContext';
import { useMemo } from 'react';
import { eachDayOfInterval, format, subDays, isSameDay } from 'date-fns';
import { ChartTooltipContent } from '@/components/ui/chart';


export function WeeklySummaryChart() {
  const { profile } = useProfile();
  const { activityLog } = profile;

  const weeklySummaryData = useMemo(() => {
    const today = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });

    return last7Days.map(day => {
      const dayStr = format(day, 'EEE');
      const value = activityLog.filter(item => isSameDay(new Date(item.timestamp), day)).length;
      return { day: dayStr, value };
    });
  }, [activityLog]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={weeklySummaryData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="day" axisLine={false} tickLine={false} dy={10} className="text-xs" />
        <YAxis hide={true} domain={[0, 'dataMax + 5']} />
        <Tooltip
          cursor={{ fill: 'hsl(var(--accent))', radius: 4 }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <p className="text-sm font-medium">{`${label}: ${payload[0].value} activities`}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
