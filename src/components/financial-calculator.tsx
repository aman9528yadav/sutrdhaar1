"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export function FinancialCalculator({ currentCalcValue }: { currentCalcValue?: string }) {
    return (
        <Card className="bg-muted/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full">
                    <Construction className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                    <h3 className="font-bold text-xl">Coming Soon</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                        We're working hard to bring you advanced financial calculation tools. Stay tuned!
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
