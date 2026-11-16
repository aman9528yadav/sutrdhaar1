import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 h-full flex flex-col pb-6 max-w-3xl mx-auto w-full px-4 animate-in fade-in duration-500">
      
      {/* Hero: Profile + XP Skeleton */}
      <div className="pt-5">
        <Card className="relative overflow-hidden rounded-2xl border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
          <CardContent className="p-5">
            {/* Top row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-40 max-w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="w-20 h-20 rounded-full shrink-0" />
            </div>

            {/* Level + XP bar */}
            <div className="mt-4 p-4 rounded-xl bg-background/30 border border-border/30 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>

            {/* Stats row */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-3 rounded-xl bg-background/30 border border-border/20">
                  <Skeleton className="w-5 h-5 rounded-full mb-1.5" />
                  <Skeleton className="h-6 w-8 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>

            {/* CTA */}
            <Skeleton className="h-9 w-full mt-3 rounded-md" />
          </CardContent>
        </Card>
      </div>

      {/* Offline Mode Banner Skeleton */}
      <Skeleton className="h-16 w-full rounded-2xl" />

      {/* Continue Where You Left Off Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-48 ml-1" />
        <div className="flex gap-3 overflow-hidden -mx-4 px-4 pb-1">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="rounded-2xl shrink-0 w-56">
              <CardContent className="p-3 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2.5 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Widgets Section Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full width widget skeleton */}
        <Card className="col-span-1 sm:col-span-2 rounded-2xl">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Skeleton className="w-7 h-7 rounded-full" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/50">
                  <Skeleton className="w-2 h-2 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Half width widget skeleton 1 */}
        <Card className="col-span-1 rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-7 h-7 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>

        {/* Half width widget skeleton 2 */}
        <Card className="col-span-1 rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-7 h-7 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
