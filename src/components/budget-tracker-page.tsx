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
// import { ManageAccountsDialog } from './manage-accounts-dialog';
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
        <div className="space-y-4 pb-24">
            {/* Header Section */}
            <div className="flex flex-col gap-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-600">
                            My Finances
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Track and manage your money</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
                
                {/* Period selector */}
                <div className="flex gap-2 mt-3">
                    {(['week', 'month', 'year'] as const).map(period => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
                                selectedPeriod === period
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            
            <AnimatePresence>
            {showFilters && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <Card className="mx-4">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="cursor-pointer">Food & Dining</Badge>
                                <Badge variant="outline" className="cursor-pointer">Shopping</Badge>
                                <Badge variant="outline" className="cursor-pointer">Transport</Badge>
                                <Badge variant="outline" className="cursor-pointer">Entertainment</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
            </AnimatePresence>

            {/* Main Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mx-4 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg"
            >
                <div className="absolute top-0 right-0 -mt-8 -mr-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-emerald-100 text-sm">Current Balance</p>
                            <h2 className="text-3xl font-bold tracking-tight">
                                ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                        </div>
                        <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
                            <div className="flex items-center gap-1 text-emerald-100 mb-1">
                                <TrendingUp className="h-3 w-3 text-emerald-300" />
                                <span className="text-xs font-medium">Income</span>
                            </div>
                            <p className="text-sm font-semibold">
                                +₹{periodIncome.toLocaleString('en-IN')}
                                <span className={`text-xs ml-1 ${incomeChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                    {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                                </span>
                            </p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
                            <div className="flex items-center gap-1 text-rose-100 mb-1">
                                <TrendingDown className="h-3 w-3 text-rose-300" />
                                <span className="text-xs font-medium">Expense</span>
                            </div>
                            <p className="text-sm font-semibold">
                                -₹{periodExpense.toLocaleString('en-IN')}
                                <span className={`text-xs ml-1 ${expenseChange >= 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                                    {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                                </span>
                            </p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
                            <div className="flex items-center gap-1 text-cyan-100 mb-1">
                                <PiggyBank className="h-3 w-3 text-cyan-300" />
                                <span className="text-xs font-medium">Savings</span>
                            </div>
                            <p className="text-sm font-semibold">
                                ₹{savings.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="flex gap-3 px-4">
                <Button
                    size="sm"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm py-5"
                    onClick={() => setIsAddTransactionOpen(true)}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
                {/* <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-emerald-500/30 text-sm py-5"
                    onClick={() => setIsManageAccountsOpen(true)}
                >
                    <CreditCard className="mr-2 h-4 w-4" /> Accounts
                </Button> */}
                <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-emerald-500/30 text-sm py-5"
                    onClick={() => setIsManageCategoriesOpen(true)}
                >
                    <Target className="mr-2 h-4 w-4" /> Categories
                </Button>
            </div>
            
            {/* Top Spending Categories */}
            {topSpendingCategories.length > 0 && (
                <Card className="mx-4">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Top Spending</CardTitle>
                            <Button size="sm" variant="ghost" className="h-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topSpendingCategories.map(([category, amount], index) => {
                                const percentage = periodExpense ? (amount / periodExpense) * 100 : 0;
                                return (
                                    <div key={index} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{category}</span>
                                            <span className="font-semibold">₹{amount.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div 
                                                className="bg-emerald-500 h-2 rounded-full" 
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
            <div className="px-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    Insights
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-emerald-500/5 border-emerald-500/20">
                        <CardContent className="p-3 flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <Coins className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Savings Rate</p>
                                <p className="font-semibold">
                                    {periodIncome > 0 ? ((savings / periodIncome) * 100).toFixed(1) : 0}%
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-cyan-500/5 border-cyan-500/20">
                        <CardContent className="p-3 flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-cyan-500/10">
                                <TrendingUpDown className="h-4 w-4 text-cyan-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Net Worth</p>
                                <p className="font-semibold">₹{totalBalance.toLocaleString('en-IN')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* Tabs for different views */}
            <div className="px-4">
                <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                    <ScrollArea className="w-full whitespace-nowrap pb-2 -mx-4 px-4">
                        <div className="flex space-x-2">
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
                                            "flex flex-col items-center justify-center px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 min-w-[70px]",
                                            currentTab === tab.id
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                                : "text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 mb-1" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                        <ScrollBar orientation="horizontal" className="invisible" />
                    </ScrollArea>

                    <TabsContent value="overview" className="space-y-4 mt-2">
                        <ScrollArea className="h-[calc(100vh-400px)]">
                            <BudgetOverview />
                            <ScrollBar />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="transactions" className="mt-2">
                        <ScrollArea className="h-[calc(100vh-300px)]">
                            <TransactionList />
                            <ScrollBar />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="goals" className="mt-2">
                        <ScrollArea className="h-[calc(100vh-350px)]">
                            <BudgetGoals />
                            <ScrollBar />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="bills" className="mt-2">
                        <ScrollArea className="h-[calc(100vh-350px)]">
                            <BillReminders />
                            <ScrollBar />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-2">
                        <ScrollArea className="h-[calc(100vh-350px)]">
                            <BudgetAnalytics />
                            <ScrollBar />
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>

            <AddTransactionDialog
                open={isAddTransactionOpen}
                onOpenChange={setIsAddTransactionOpen}
            />

            {/* <ManageAccountsDialog
                open={isManageAccountsOpen}
                onOpenChange={setIsManageAccountsOpen}
            /> */}

            <ManageCategoriesDialog
                open={isManageCategoriesOpen}
                onOpenChange={setIsManageCategoriesOpen}
            />
        </div>
    );
}
