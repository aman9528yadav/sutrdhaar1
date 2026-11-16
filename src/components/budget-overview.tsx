"use client";

import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Wallet, CreditCard, PiggyBank } from 'lucide-react';

export function BudgetOverview() {
    const { profile } = useProfile();
    const { budget } = profile;

    // Recent Transactions (Limit 5)
    const recentTransactions = [...budget.transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-4">
            {/* Accounts Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">My Accounts</h3>
                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-primary">Manage</span>
                </div>
                <div className="grid gap-3">
                    {budget.accounts.map(account => (
                        <Card key={account.id} className="bg-card/50 backdrop-blur-sm border-white/5">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{account.name}</p>
                                        <p className="text-xs text-muted-foreground">****</p>
                                    </div>
                                </div>
                                <p className="font-bold">₹{account.balance.toLocaleString('en-IN')}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Savings Goals Preview */}
            {budget.goals.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Savings Goals</h3>
                        <span className="text-xs text-muted-foreground cursor-pointer hover:text-primary">View All</span>
                    </div>
                    <div className="space-y-3">
                        {budget.goals.slice(0, 2).map(goal => {
                            const progress = (goal.currentAmount / goal.targetAmount) * 100;
                            return (
                                <Card key={goal.id} className="bg-card/50 backdrop-blur-sm border-white/5">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <PiggyBank className="h-4 w-4 text-emerald-500" />
                                                <span className="font-medium">{goal.name}</span>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-500">{Math.round(progress)}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2 bg-emerald-950/20" indicatorClassName="bg-emerald-500" />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>₹{goal.currentAmount.toLocaleString('en-IN')}</span>
                                            <span>Target: ₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Activity Preview */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Recent Activity</h3>
                </div>
                <div className="space-y-2">
                    {recentTransactions.length > 0 ? (
                        recentTransactions.map(transaction => (
                            <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl bg-card/30 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {transaction.type === 'income' ? <ArrowRight className="h-4 w-4 rotate-180" /> : <ArrowRight className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{transaction.description}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`font-bold text-sm ${transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">No recent transactions</p>
                    )}
                </div>
            </div>
        </div>
    );
}
