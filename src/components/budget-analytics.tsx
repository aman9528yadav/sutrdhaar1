"use client";

import React, { useMemo } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PieChart, BarChart3, Calendar, Zap, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function BudgetAnalytics() {
    const { profile } = useProfile();
    const { budget } = profile;

    const analytics = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyTransactions = budget.transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const totalIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);

        const totalExpense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        // Category-wise expenses
        const categoryExpenses: { [key: string]: number } = {};
        monthlyTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const category = budget.categories.find(c => c.id === t.categoryId);
                const categoryName = category?.name || 'Uncategorized';
                categoryExpenses[categoryName] = (categoryExpenses[categoryName] || 0) + t.amount;
            });

        const sortedCategories = Object.entries(categoryExpenses)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        // Account balances
        const accountBalances = budget.accounts.map(acc => ({
            name: acc.name,
            balance: acc.balance
        }));

        // Last 6 months trend
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.getMonth();
            const year = date.getFullYear();

            const monthTransactions = budget.transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === month && tDate.getFullYear() === year;
            });

            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((acc, t) => acc + t.amount, 0);

            const expense = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((acc, t) => acc + t.amount, 0);

            monthlyTrend.push({
                month: date.toLocaleDateString('en-IN', { month: 'short' }),
                income,
                expense,
                savings: income - expense
            });
        }

        // Daily average
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyAvgIncome = totalIncome / daysInMonth;
        const dailyAvgExpense = totalExpense / daysInMonth;

        // Largest transactions
        const largestExpense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => b.amount - a.amount)[0];

        const largestIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .sort((a, b) => b.amount - a.amount)[0];

        // Spending pattern (weekday vs weekend)
        const weekdayExpense = monthlyTransactions
            .filter(t => {
                const day = new Date(t.date).getDay();
                return t.type === 'expense' && day >= 1 && day <= 5;
            })
            .reduce((acc, t) => acc + t.amount, 0);

        const weekendExpense = monthlyTransactions
            .filter(t => {
                const day = new Date(t.date).getDay();
                return t.type === 'expense' && (day === 0 || day === 6);
            })
            .reduce((acc, t) => acc + t.amount, 0);

        // Budget health
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
        let budgetHealth: 'excellent' | 'good' | 'warning' | 'critical';
        if (savingsRate >= 30) budgetHealth = 'excellent';
        else if (savingsRate >= 20) budgetHealth = 'good';
        else if (savingsRate >= 0) budgetHealth = 'warning';
        else budgetHealth = 'critical';

        return {
            totalIncome,
            totalExpense,
            savings: totalIncome - totalExpense,
            savingsRate,
            categoryExpenses: sortedCategories,
            accountBalances,
            monthlyTrend,
            transactionCount: monthlyTransactions.length,
            dailyAvgIncome,
            dailyAvgExpense,
            largestExpense,
            largestIncome,
            weekdayExpense,
            weekendExpense,
            budgetHealth,
        };
    }, [budget]);

    const maxCategoryExpense = analytics.categoryExpenses[0]?.[1] || 1;

    const healthConfig = {
        excellent: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Excellent', icon: CheckCircle },
        good: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Good', icon: CheckCircle },
        warning: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Warning', icon: AlertCircle },
        critical: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Critical', icon: AlertCircle },
    };

    const health = healthConfig[analytics.budgetHealth];

    return (
        <div className="space-y-6">
            {/* Budget Health */}
            <Card className={`border-2 ${analytics.budgetHealth === 'excellent' ? 'border-emerald-500/20' : analytics.budgetHealth === 'critical' ? 'border-red-500/20' : 'border-border'}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <health.icon className={`h-5 w-5 ${health.color}`} />
                        Budget Health: {health.label}
                    </CardTitle>
                    <CardDescription>
                        {analytics.budgetHealth === 'excellent' && "Great job! You're saving well."}
                        {analytics.budgetHealth === 'good' && "You're doing well. Keep it up!"}
                        {analytics.budgetHealth === 'warning' && "Consider reducing expenses."}
                        {analytics.budgetHealth === 'critical' && "You're spending more than earning!"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span>Savings Rate</span>
                            <span className={`font-bold ${health.color}`}>{analytics.savingsRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.max(0, analytics.savingsRate)} className="h-3" />
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Row 1: Income and Expense */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                <span className="text-2xl font-bold text-emerald-500">
                                    ₹{analytics.totalIncome.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Avg: ₹{analytics.dailyAvgIncome.toFixed(0)}/day
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-rose-500" />
                                <span className="text-2xl font-bold text-rose-500">
                                    ₹{analytics.totalExpense.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Avg: ₹{analytics.dailyAvgExpense.toFixed(0)}/day
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Row 2: Net Savings and Savings Rate */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Net Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className={`text-2xl font-bold ${analytics.savings >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {analytics.savings >= 0 ? '+' : ''}₹{analytics.savings.toLocaleString('en-IN')}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {analytics.transactionCount} transactions this month
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className={`text-2xl font-bold ${health.color}`}>
                                {analytics.savingsRate.toFixed(1)}%
                            </div>
                            <Progress value={Math.max(0, analytics.savingsRate)} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Largest Transactions */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="h-4 w-4 text-emerald-500" />
                            Largest Income
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analytics.largestIncome ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{analytics.largestIncome.description}</span>
                                    <span className="text-emerald-500 font-bold">
                                        ₹{analytics.largestIncome.amount.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(analytics.largestIncome.date).toLocaleDateString('en-IN')}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No income recorded</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="h-4 w-4 text-rose-500" />
                            Largest Expense
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analytics.largestExpense ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{analytics.largestExpense.description}</span>
                                    <span className="text-rose-500 font-bold">
                                        ₹{analytics.largestExpense.amount.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(analytics.largestExpense.date).toLocaleDateString('en-IN')}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No expenses recorded</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Spending Pattern */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Spending Pattern
                    </CardTitle>
                    <CardDescription>Weekday vs Weekend spending comparison</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Weekday</span>
                                <span className="text-muted-foreground">
                                    ₹{analytics.weekdayExpense.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <Progress
                                value={(analytics.weekdayExpense / (analytics.weekdayExpense + analytics.weekendExpense || 1)) * 100}
                                className="h-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Weekend</span>
                                <span className="text-muted-foreground">
                                    ₹{analytics.weekendExpense.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <Progress
                                value={(analytics.weekendExpense / (analytics.weekdayExpense + analytics.weekendExpense || 1)) * 100}
                                className="h-2"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Top Spending Categories
                    </CardTitle>
                    <CardDescription>Your highest expense categories this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {analytics.categoryExpenses.length > 0 ? (
                        analytics.categoryExpenses.map(([category, amount]) => (
                            <div key={category} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{category}</span>
                                    <span className="text-muted-foreground">
                                        ₹{amount.toLocaleString('en-IN')} ({((amount / analytics.totalExpense) * 100).toFixed(1)}%)
                                    </span>
                                </div>
                                <Progress
                                    value={(amount / maxCategoryExpense) * 100}
                                    className="h-2"
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No expenses recorded this month</p>
                    )}
                </CardContent>
            </Card>

            {/* Account Balances */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Account Balances
                    </CardTitle>
                    <CardDescription>Current balance across all accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {analytics.accountBalances.map((account) => {
                        const totalBalance = analytics.accountBalances.reduce((sum, acc) => sum + acc.balance, 0);
                        const percentage = totalBalance > 0 ? (account.balance / totalBalance) * 100 : 0;

                        return (
                            <div key={account.name} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{account.name}</span>
                                    <span className="text-muted-foreground">
                                        ₹{account.balance.toLocaleString('en-IN')} ({percentage.toFixed(1)}%)
                                    </span>
                                </div>
                                <Progress
                                    value={percentage}
                                    className="h-2"
                                />
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        6-Month Trend
                    </CardTitle>
                    <CardDescription>Income vs Expense over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analytics.monthlyTrend.map((month) => (
                            <div key={month.month} className="space-y-2">
                                <div className="flex items-center justify-between text-sm font-medium">
                                    <span>{month.month}</span>
                                    <span className={month.savings >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                        {month.savings >= 0 ? '+' : ''}₹{month.savings.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-1">
                                        <div className="text-xs text-muted-foreground">Income</div>
                                        <div className="h-8 bg-emerald-500/20 rounded flex items-center justify-center text-xs font-medium text-emerald-500">
                                            ₹{month.income.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="text-xs text-muted-foreground">Expense</div>
                                        <div className="h-8 bg-rose-500/20 rounded flex items-center justify-center text-xs font-medium text-rose-500">
                                            ₹{month.expense.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
