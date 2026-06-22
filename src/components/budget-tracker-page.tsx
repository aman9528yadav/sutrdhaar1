"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Plus,
    Target,
    CreditCard,
    Download,
    PieChart,
    Filter,
    Search,
    MoreVertical,
    BarChart3,
    Coins,
    ReceiptText,
    Calendar,
    TrendingUpDown,
    PiggyBank,
    ReceiptIndianRupee,
    Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/ProfileContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AddTransactionDialog } from './add-transaction-dialog';
import { TransactionList } from './transaction-list';
import { BudgetOverview } from './budget-overview';
import { ManageAccountsDialog } from './manage-accounts-dialog';
import { ManageCategoriesDialog } from './manage-categories-dialog';
import { BudgetAnalytics } from './budget-analytics';
import { BudgetGoals } from './budget-goals';
import { BillReminders } from './bill-reminders';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRouter, useSearchParams } from 'next/navigation';

interface BudgetTrackerPageProps {
    initialTab?: string;
}

export function BudgetTrackerPage({ initialTab }: BudgetTrackerPageProps) {
    const { profile } = useProfile();
    const { budget } = profile;
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
    const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [showFilters, setShowFilters] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();
    const currentTab = searchParams.get('tab') || initialTab || 'overview';

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const totalBalance = budget.accounts.reduce((acc, account) => acc + account.balance, 0);

    // Calculate total income and expenses for the current period
    const now = new Date();
    let periodStartDate = new Date(now);
    let periodEndDate = new Date(now);
    
    if (selectedPeriod === 'week') {
        periodStartDate.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
        periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    } else { // year
        periodStartDate = new Date(now.getFullYear(), 0, 1); // First day of current year
    }

    const periodTransactions = budget.transactions.filter(t => {
        const date = new Date(t.date);
        return date >= periodStartDate && date <= periodEndDate;
    });

    const periodIncome = periodTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const periodExpense = periodTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const savings = periodIncome - periodExpense;
    
    // Calculate percentage changes
    let prevPeriodStartDate = new Date(periodStartDate);
    let prevPeriodEndDate = new Date(periodEndDate);
    
    if (selectedPeriod === 'week') {
        // Previous week: 14 days ago to 7 days ago
        prevPeriodStartDate.setDate(periodStartDate.getDate() - 7);
        prevPeriodEndDate.setDate(periodEndDate.getDate() - 7);
    } else if (selectedPeriod === 'month') {
        // Previous month: First day of previous month to last day of previous month
        prevPeriodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevPeriodEndDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
    } else { // year
        // Previous year: First day of previous year to last day of previous year
        prevPeriodStartDate = new Date(now.getFullYear() - 1, 0, 1);
        prevPeriodEndDate = new Date(now.getFullYear() - 1, 11, 31); // Last day of previous year
    }
    
    const prevPeriodTransactions = budget.transactions.filter(t => {
        const date = new Date(t.date);
        return date >= prevPeriodStartDate && date <= prevPeriodEndDate;
    });
    
    const prevPeriodIncome = prevPeriodTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);
    
    const prevPeriodExpense = prevPeriodTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);
    
    const incomeChange = prevPeriodIncome ? ((periodIncome - prevPeriodIncome) / prevPeriodIncome) * 100 : 0;
    const expenseChange = prevPeriodExpense ? ((periodExpense - prevPeriodExpense) / prevPeriodExpense) * 100 : 0;
    
    // Top categories by spending
    const categoryExpenses: Record<string, number> = {};
    periodTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const category = budget.categories.find(c => c.id === t.categoryId)?.name || 'Uncategorized';
            categoryExpenses[category] = (categoryExpenses[category] || 0) + t.amount;
        });
    
    const topSpendingCategories = Object.entries(categoryExpenses)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-24">
            {/* Background glowing orbs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-1/2 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] -z-10" />

            <div className="w-full max-w-md mx-auto space-y-5 pt-6 px-4 h-full flex flex-col">
                {/* Header Section & Categories Action */}
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-500">
                            My Finances
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Track and manage your money</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-card/50 backdrop-blur-xl border border-border/50 hover:bg-card/80 text-muted-foreground" onClick={() => setIsManageAccountsOpen(true)}>
                            <Wallet className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-card/50 backdrop-blur-xl border border-border/50 hover:bg-card/80 text-muted-foreground" onClick={() => setIsManageCategoriesOpen(true)}>
                            <Target className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-card/50 backdrop-blur-xl border border-border/50 hover:bg-card/80 text-muted-foreground" onClick={() => setShowFilters(!showFilters)}>
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                
                {/* Period selector (Segmented Control) */}
                <div className="flex p-1 bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl shrink-0">
                    {(['week', 'month', 'year'] as const).map(period => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={cn(
                                "flex-1 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                                selectedPeriod === period
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            
                <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden shrink-0"
                    >
                        <Card className="bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="cursor-pointer bg-background/50">Food & Dining</Badge>
                                    <Badge variant="outline" className="cursor-pointer bg-background/50">Shopping</Badge>
                                    <Badge variant="outline" className="cursor-pointer bg-background/50">Transport</Badge>
                                    <Badge variant="outline" className="cursor-pointer bg-background/50">Entertainment</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Main Balance Card (Glassmorphic) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-xl shadow-emerald-500/20 shrink-0"
                >
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-black/20 blur-2xl" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Current Balance</p>
                                <h2 className="text-4xl font-black tracking-tight leading-none">
                                    ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h2>
                            </div>
                            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md shadow-inner border border-white/20">
                                <Wallet className="h-7 w-7 text-white" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-2xl bg-black/20 p-2.5 backdrop-blur-md border border-white/10 flex flex-col justify-center">
                                <div className="flex items-center gap-1 text-emerald-100 mb-1">
                                    <TrendingUp className="h-3 w-3 text-emerald-300 shrink-0" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Income</span>
                                </div>
                                <p className="text-xs sm:text-sm font-black leading-tight text-white break-words">
                                    +₹{periodIncome.toLocaleString('en-IN')}
                                </p>
                                <p className={cn("text-[9px] font-bold mt-0.5", incomeChange >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                                    {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                                </p>
                            </div>
                            <div className="rounded-2xl bg-black/20 p-2.5 backdrop-blur-md border border-white/10 flex flex-col justify-center">
                                <div className="flex items-center gap-1 text-rose-100 mb-1">
                                    <TrendingDown className="h-3 w-3 text-rose-300 shrink-0" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Expense</span>
                                </div>
                                <p className="text-xs sm:text-sm font-black leading-tight text-white break-words">
                                    -₹{periodExpense.toLocaleString('en-IN')}
                                </p>
                                <p className={cn("text-[9px] font-bold mt-0.5", expenseChange >= 0 ? 'text-rose-300' : 'text-emerald-300')}>
                                    {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white/20 p-2.5 backdrop-blur-md border border-white/20 flex flex-col justify-center">
                                <div className="flex items-center gap-1 text-cyan-100 mb-1">
                                    <PiggyBank className="h-3 w-3 text-cyan-200 shrink-0" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-50">Savings</span>
                                </div>
                                <p className="text-xs sm:text-sm font-black leading-tight text-white break-words">
                                    ₹{savings.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
                
                {/* Top Spending Categories */}
                {topSpendingCategories.length > 0 && (
                    <Card className="bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl shadow-sm shrink-0 overflow-hidden">
                        <CardHeader className="pb-3 pt-5 px-5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <ReceiptText className="w-4 h-4 text-emerald-500" /> Top Spending
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-5">
                            <div className="space-y-4">
                                {topSpendingCategories.map(([category, amount], index) => {
                                    const percentage = periodExpense ? (amount / periodExpense) * 100 : 0;
                                    return (
                                        <div key={index} className="space-y-1.5">
                                            <div className="flex justify-between text-xs items-center">
                                                <span className="font-semibold text-muted-foreground">{category}</span>
                                                <span className="font-bold text-foreground">₹{amount.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                {/* Quick Insights */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                    <Card className="bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-emerald-500/10">
                                <Coins className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Savings Rate</p>
                                <p className="text-lg font-black leading-none text-foreground mt-0.5">
                                    {periodIncome > 0 ? ((savings / periodIncome) * 100).toFixed(1) : 0}%
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-cyan-500/10">
                                <TrendingUpDown className="h-5 w-5 text-cyan-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net Worth</p>
                                <p className="text-lg font-black leading-none text-foreground mt-0.5">
                                    ₹{(totalBalance / 1000).toFixed(1)}k
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Tabs for different views */}
                <div className="flex-1 flex flex-col shrink-0">
                    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col">
                        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 shrink-0">
                            {[
                                { id: 'overview', label: 'Overview', icon: Wallet },
                                { id: 'transactions', label: 'Transactions', icon: ReceiptText },
                                { id: 'goals', label: 'Goals', icon: Target },
                                { id: 'bills', label: 'Bills', icon: ReceiptIndianRupee },
                                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0",
                                            currentTab === tab.id
                                                ? "bg-emerald-500 text-white shadow-md border-none"
                                                : "bg-card/50 backdrop-blur-xl border border-border/50 text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1 mt-4 relative">
                            <TabsContent value="overview" className="mt-0">
                                <div className="pb-10"><BudgetOverview /></div>
                            </TabsContent>

                            <TabsContent value="transactions" className="mt-0">
                                <div className="pb-10"><TransactionList /></div>
                            </TabsContent>

                            <TabsContent value="goals" className="mt-0">
                                <div className="pb-10"><BudgetGoals /></div>
                            </TabsContent>

                            <TabsContent value="bills" className="mt-0">
                                <div className="pb-10"><BillReminders /></div>
                            </TabsContent>

                            <TabsContent value="analytics" className="mt-0">
                                <div className="pb-10"><BudgetAnalytics /></div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Floating Action Button (FAB) */}
                <div className="fixed bottom-24 right-4 z-[90] sm:bottom-6 sm:right-6">
                    <Button 
                        size="icon"
                        onClick={() => setIsAddTransactionOpen(true)}
                        className="h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95 border-4 border-background"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>

                <AddTransactionDialog
                    open={isAddTransactionOpen}
                    onOpenChange={setIsAddTransactionOpen}
                />

                <ManageAccountsDialog
                    open={isManageAccountsOpen}
                    onOpenChange={setIsManageAccountsOpen}
                />

                <ManageCategoriesDialog
                    open={isManageCategoriesOpen}
                    onOpenChange={setIsManageCategoriesOpen}
                />
            </div>
        </div>
    );
}
