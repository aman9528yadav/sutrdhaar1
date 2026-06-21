"use client";

import React, { useState, useMemo } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    TrendingUp,
    TrendingDown,
    Activity,
    Target,
    Award,
    Calendar,
    Clock,
    Zap,
    BarChart3,
    PieChart,
    Download,
    Share2,
    Filter,
    History,
    CheckCircle2,
    ArrowRight,
    Users,
    Heart,
    Star,
    Flame,
    CalendarDays,
    ChartNoAxesColumn,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { isToday, isYesterday, formatDistanceToNow, startOfWeek, endOfWeek, isWithinInterval, format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ActivityBreakdownChart } from '@/components/activity-breakdown-chart';
import { WeeklySummaryChart } from './weekly-summary-chart';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const StatCard = ({
    title,
    value,
    change,
    description,
    icon: Icon,
    trend,
    className
}: {
    title: string;
    value: string | number;
    change?: number;
    description: string;
    icon?: any;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
}) => {
    const isPositive = change !== undefined && change >= 0;
    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
        <Card className={cn("bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-white/20 shadow-lg overflow-hidden relative group hover:scale-[1.02] transition-all duration-300", className)}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="p-4 pb-2 relative z-10">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-primary" />}
                        <CardTitle className="text-xs font-medium text-white/60 uppercase tracking-wider">{title}</CardTitle>
                    </div>
                    {change !== undefined && (
                        <Badge variant={isPositive ? "default" : "destructive"} className="text-xs px-2 py-0.5">
                            <TrendIcon className="h-3 w-3 mr-0.5" />
                            {Math.abs(change)}%
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 relative z-10">
                <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">{value}</div>
                <p className="text-xs text-white/40">{description}</p>
            </CardContent>
        </Card>
    );
};

const InsightCard = ({ title, description, icon: Icon, color }: { title: string; description: string; icon: any; color: string }) => (
    <div className={cn("p-4 rounded-xl border transition-all hover:bg-white/5", `bg-${color}-500/10 border-${color}-500/20`)}>
        <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", `bg-${color}-500/20`)}>
                <Icon className={cn("h-4 w-4", `text-${color}-400`)} />
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
                <p className="text-xs text-white/60">{description}</p>
            </div>
        </div>
    </div>
);

const DailyGoalCard = ({ current, target }: { current: number; target: number }) => {
    const progress = Math.min(100, (current / target) * 100);
    const isCompleted = current >= target;

    return (
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-xl border-primary/20 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
            <CardHeader className="pb-2">
                <div className="flex flex-wrap justify-between items-center gap-2">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Daily Goal
                    </CardTitle>
                    {isCompleted && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                        </Badge>
                    )}
                </div>
                <CardDescription className="text-white/60">
                    {isCompleted
                        ? "You've reached your daily goal! Great job!"
                        : `You need ${target - current} more activities to reach your goal.`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-white/80">
                        <span>Progress</span>
                        <span className="font-medium">{current} / {target}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div 
                            className={`h-full ${isCompleted ? "bg-green-500" : "bg-primary"}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const EngagementMetrics = ({ history }: { history: any[] }) => {
    // Calculate engagement metrics
    const totalUsers = 1245; // Placeholder for actual user count
    const activeUsers = 324; // Placeholder for actual active user count
    const retentionRate = 78; // Placeholder for actual retention rate
    const avgSessionDuration = "12m 34s"; // Placeholder for actual session duration

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-white/60 uppercase tracking-wider">Total Users</span>
                </div>
                <div className="text-xl font-bold text-white">{totalUsers.toLocaleString()}</div>
                <div className="text-xs text-white/40">Active community</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-white/60 uppercase tracking-wider">Active Users</span>
                </div>
                <div className="text-xl font-bold text-white">{activeUsers.toLocaleString()}</div>
                <div className="text-xs text-white/40">Today</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-white/60 uppercase tracking-wider">Retention</span>
                </div>
                <div className="text-xl font-bold text-white">{retentionRate}%</div>
                <div className="text-xs text-white/40">30-day rate</div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-xl border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span className="text-xs text-white/60 uppercase tracking-wider">Avg Session</span>
                </div>
                <div className="text-xl font-bold text-white">{avgSessionDuration}</div>
                <div className="text-xs text-white/40">Time spent</div>
            </div>
        </div>
    );
};

const ComparisonChart = ({ history }: { history: any[] }) => {
    // Mock data for comparison chart
    const comparisonData = [
        { name: 'Jan', thisYear: 4000, lastYear: 2400 },
        { name: 'Feb', thisYear: 3000, lastYear: 1398 },
        { name: 'Mar', thisYear: 2000, lastYear: 9800 },
        { name: 'Apr', thisYear: 2780, lastYear: 3908 },
        { name: 'May', thisYear: 1890, lastYear: 4800 },
        { name: 'Jun', thisYear: 2390, lastYear: 3800 },
    ];

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Growth Comparison</h3>
                <Badge variant="outline" className="text-xs">vs Last Year</Badge>
            </div>
            <div className="space-y-2">
                {comparisonData.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-8 text-xs text-white/60">{item.name}</div>
                        <div className="flex-1 flex gap-1">
                            <div 
                                className="h-8 bg-gradient-to-r from-primary/30 to-primary/50 rounded-l" 
                                style={{ width: `${(item.thisYear / 10000) * 100}%` }}
                            />
                            <div 
                                className="h-8 bg-gradient-to-r from-secondary/30 to-secondary/50 rounded-r" 
                                style={{ width: `${(item.lastYear / 10000) * 100}%` }}
                            />
                        </div>
                        <div className="w-16 text-right text-xs text-white/60">{item.thisYear}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RecentActivityList = ({ history }: { history: any[] }) => {
    if (!history || history.length === 0) {
        return (
            <div className="text-center py-8 text-white/40">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {history.slice(0, 5).map((item) => {
                let title = "Activity";
                let details = "";
                let Icon = Activity;

                if (item.type === 'conversion') {
                    title = "Conversion";
                    details = `${item.fromValue} ${item.fromUnit} → ${item.toValue} ${item.toUnit}`;
                    Icon = ArrowRight;
                } else if (item.type === 'calculator') {
                    title = "Calculation";
                    details = `${item.expression} = ${item.result}`;
                    Icon = Calendar;
                } else if (item.type === 'date_calculation') {
                    title = "Date Calc";
                    details = item.calculationType;
                    Icon = Calendar;
                }

                return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{title}</p>
                            <p className="text-xs text-white/50 truncate">{details}</p>
                        </div>
                        <div className="text-xs text-white/40 whitespace-nowrap">
                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export function AnalyticsPageEnhanced() {
    const { profile } = useProfile();
    const { history, favorites, budget } = profile;
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
    const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
    const [showInsights, setShowInsights] = useState(true);

    const getCountForDay = (items: any[], dateFn: (d: Date) => boolean) => {
        return items.filter((c: { timestamp: string | number | Date; }) => dateFn(new Date(c.timestamp))).length;
    };

    const getCountForWeek = (items: any[]) => {
        const now = new Date();
        const start = startOfWeek(now);
        const end = endOfWeek(now);
        return items.filter((c: { timestamp: string | number | Date; }) =>
            isWithinInterval(new Date(c.timestamp), { start, end })
        ).length;
    };

    const getCountForMonth = (items: any[]) => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        return items.filter((c: { timestamp: string | number | Date; }) =>
            isWithinInterval(new Date(c.timestamp), { start, end })
        ).length;
    };

    const getCountForYear = (items: any[]) => {
        const now = new Date();
        const start = startOfYear(now);
        const end = endOfYear(now);
        return items.filter((c: { timestamp: string | number | Date; }) =>
            isWithinInterval(new Date(c.timestamp), { start, end })
        ).length;
    };

    const analyticsData = useMemo(() => {
        const { allTimeActivities = 0, streak = 0 } = profile.stats || {};

        const conversions = history.filter(h => h.type === 'conversion');
        const calculatorOps = history.filter(h => h.type === 'calculator');
        const dateCalculations = history.filter(h => h.type === 'date_calculation');

        const conversionsToday = getCountForDay(conversions, isToday);
        const conversionsYesterday = getCountForDay(conversions, isYesterday);
        const conversionsWeek = getCountForWeek(conversions);
        const conversionsMonth = getCountForMonth(conversions);
        const conversionsYear = getCountForYear(conversions);

        const calculatorOpsToday = getCountForDay(calculatorOps, isToday);
        const calculatorOpsYesterday = getCountForDay(calculatorOps, isYesterday);
        const calculatorOpsWeek = getCountForWeek(calculatorOps);
        const calculatorOpsMonth = getCountForMonth(calculatorOps);
        const calculatorOpsYear = getCountForYear(calculatorOps);

        const dateCalculationsToday = getCountForDay(dateCalculations, isToday);
        const dateCalculationsYesterday = getCountForDay(dateCalculations, isYesterday);
        const dateCalculationsWeek = getCountForWeek(dateCalculations);
        const dateCalculationsMonth = getCountForMonth(dateCalculations);
        const dateCalculationsYear = getCountForYear(dateCalculations);

        const calcPercentageChange = (todayCount: number, yesterdayCount: number) => {
            if (yesterdayCount === 0) return todayCount > 0 ? 100 : 0;
            return Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
        };

        // Calculate productivity score (0-100)
        const productivityScore = Math.min(100, Math.round(
            (conversionsToday * 2 + calculatorOpsToday * 1.5 + dateCalculationsToday * 1.5) / 10 * 100
        ));

        // Most active hour
        const hourCounts = history.reduce((acc: any, item) => {
            const hour = new Date(item.timestamp).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});
        const mostActiveHour = Object.entries(hourCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 12;

        // Calculate period-based data
        let currentPeriodActivities = 0;
        let previousPeriodActivities = 0;
        
        switch(timeRange) {
            case 'today':
                currentPeriodActivities = conversionsToday + calculatorOpsToday + dateCalculationsToday;
                previousPeriodActivities = conversionsYesterday + calculatorOpsYesterday + dateCalculationsYesterday;
                break;
            case 'week':
                currentPeriodActivities = conversionsWeek + calculatorOpsWeek + dateCalculationsWeek;
                
                // Calculate previous week
                const now = new Date();
                const startPrevWeek = startOfWeek(subDays(now, 7));
                const endPrevWeek = endOfWeek(subDays(now, 7));
                const prevWeekActivities = history.filter((c: { timestamp: string | number | Date; }) =>
                    isWithinInterval(new Date(c.timestamp), { start: startPrevWeek, end: endPrevWeek })
                ).length;
                
                previousPeriodActivities = prevWeekActivities;
                break;
            case 'month':
                currentPeriodActivities = conversionsMonth + calculatorOpsMonth + dateCalculationsMonth;
                
                // Calculate previous month
                const startPrevMonth = startOfMonth(subDays(new Date(), 30));
                const endPrevMonth = endOfMonth(subDays(new Date(), 30));
                const prevMonthActivities = history.filter((c: { timestamp: string | number | Date; }) =>
                    isWithinInterval(new Date(c.timestamp), { start: startPrevMonth, end: endPrevMonth })
                ).length;
                
                previousPeriodActivities = prevMonthActivities;
                break;
            case 'year':
                currentPeriodActivities = conversionsYear + calculatorOpsYear + dateCalculationsYear;
                
                // Calculate previous year
                const startPrevYear = startOfYear(subDays(new Date(), 365));
                const endPrevYear = endOfYear(subDays(new Date(), 365));
                const prevYearActivities = history.filter((c: { timestamp: string | number | Date; }) =>
                    isWithinInterval(new Date(c.timestamp), { start: startPrevYear, end: endPrevYear })
                ).length;
                
                previousPeriodActivities = prevYearActivities;
                break;
        }

        return {
            totalActivities: {
                value: allTimeActivities,
                change: calcPercentageChange(
                    conversionsToday + calculatorOpsToday + dateCalculationsToday,
                    conversionsYesterday + calculatorOpsYesterday + dateCalculationsYesterday
                )
            },
            currentPeriodActivities: {
                value: currentPeriodActivities,
                change: previousPeriodActivities === 0 ? 100 : Math.round(((currentPeriodActivities - previousPeriodActivities) / previousPeriodActivities) * 100),
                description: `Activities this ${timeRange}`
            },
            todayActivities: {
                value: conversionsToday + calculatorOpsToday + dateCalculationsToday,
                description: 'Activities today'
            },
            weekActivities: {
                value: conversionsWeek,
                description: 'This week'
            },
            monthActivities: {
                value: conversionsMonth,
                description: 'This month'
            },
            totalConversions: {
                value: conversions.length,
                change: calcPercentageChange(conversionsToday, conversionsYesterday)
            },
            calculatorOps: {
                value: calculatorOps.length,
                change: calcPercentageChange(calculatorOpsToday, calculatorOpsYesterday)
            },
            currentStreak: {
                value: streak,
                description: `${streak} day${streak !== 1 ? 's' : ''} streak`
            },
            favoriteConversions: {
                value: favorites.length,
                description: 'Saved favorites'
            },
            productivityScore: {
                value: productivityScore,
                description: 'Today\'s productivity'
            },
            mostActiveHour: {
                value: `${mostActiveHour}:00`,
                description: 'Peak activity time'
            },
            avgPerDay: {
                value: Math.round(allTimeActivities / Math.max(1, streak)),
                description: 'Average per day'
            }
        };
    }, [history, favorites, profile, timeRange]);

    // Generate insights
    const insights = useMemo(() => {
        const insights = [];

        if (analyticsData.currentStreak.value >= 7) {
            insights.push({
                title: '🔥 On Fire!',
                description: `You've maintained a ${analyticsData.currentStreak.value}-day streak. Keep it up!`,
                icon: Award,
                color: 'orange'
            });
        }

        if (analyticsData.productivityScore.value >= 80) {
            insights.push({
                title: '⚡ High Productivity',
                description: `Your productivity score is ${analyticsData.productivityScore.value}%. You're crushing it today!`,
                icon: Zap,
                color: 'green'
            });
        }

        if (analyticsData.todayActivities.value > analyticsData.avgPerDay.value) {
            insights.push({
                title: '📈 Above Average',
                description: `You're ${Math.round((analyticsData.todayActivities.value / analyticsData.avgPerDay.value - 1) * 100)}% more active than usual!`,
                icon: TrendingUp,
                color: 'blue'
            });
        }

        if (favorites.length >= 10) {
            insights.push({
                title: '⭐ Power User',
                description: `You have ${favorites.length} favorite conversions. You know what you need!`,
                icon: Target,
                color: 'purple'
            });
        }

        return insights;
    }, [analyticsData, favorites]);

    const exportData = () => {
        const data = {
            exported: new Date().toISOString(),
            stats: analyticsData,
            history: history.slice(0, 100),
            timeRange: timeRange
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}-${timeRange}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
                    <p className="text-sm text-white/60">Track your productivity and usage patterns</p>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                    <Select value={timeRange} onValueChange={(value: 'today' | 'week' | 'month' | 'year') => setTimeRange(value)}>
                        <SelectTrigger className="w-full sm:w-[120px] bg-white/5 border-white/20 text-white flex-1">
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10 text-white">
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={exportData} className="bg-white/5 border-white/20 text-white hover:bg-white/10 flex-1 whitespace-nowrap">
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <div className="w-full overflow-x-auto pb-2 -mb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex w-max min-w-full sm:w-full sm:grid sm:grid-cols-3 lg:w-[600px] h-auto bg-white/5 border border-white/10 gap-1 p-1">
                    <TabsTrigger value="overview" className="whitespace-nowrap px-6 py-2 text-sm">Overview</TabsTrigger>
                    <TabsTrigger value="engagement" className="whitespace-nowrap px-6 py-2 text-sm">Engagement</TabsTrigger>
                    <TabsTrigger value="detailed" className="whitespace-nowrap px-6 py-2 text-sm">Detailed Stats</TabsTrigger>
                </TabsList>
            </div>

                <TabsContent value="overview" className="space-y-6 mt-6">
                    {/* Top Stats Row */}
                    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 snap-x snap-mandatory no-scrollbar">
                        <div className="min-w-[280px] sm:min-w-0 snap-center sm:col-span-2 lg:col-span-1">
                            <DailyGoalCard current={analyticsData.todayActivities.value} target={10} />
                        </div>
                        <StatCard
                            title="Current Streak"
                            value={analyticsData.currentStreak.value}
                            description={analyticsData.currentStreak.description}
                            icon={Award}
                            className="min-w-[200px] sm:min-w-0 snap-center bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20"
                        />
                        <StatCard
                            title="This Period"
                            value={analyticsData.currentPeriodActivities.value}
                            change={analyticsData.currentPeriodActivities.change}
                            description={analyticsData.currentPeriodActivities.description}
                            icon={CalendarDays}
                            className="min-w-[200px] sm:min-w-0 snap-center"
                        />
                        <StatCard
                            title="Productivity"
                            value={`${analyticsData.productivityScore.value}%`}
                            description={analyticsData.productivityScore.description}
                            icon={Zap}
                            className="min-w-[200px] sm:min-w-0 snap-center bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20"
                        />
                    </div>

                    {/* Main Charts Area */}
                    <div className="space-y-6">
                        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        <span>Activity Overview</span>
                                    </div>
                                    <Select value={chartType} onValueChange={(value: 'bar' | 'line' | 'pie') => setChartType(value)}>
                                        <SelectTrigger className="w-[100px] h-8 bg-white/5 border-white/20 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10 text-white">
                                            <SelectItem value="bar">Bar</SelectItem>
                                            <SelectItem value="line">Line</SelectItem>
                                            <SelectItem value="pie">Pie</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardTitle>
                                <CardDescription className="text-white/40">Your activity over the selected period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] sm:h-[250px] w-full">
                                    <WeeklySummaryChart />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Comparison Chart */}
                        <ComparisonChart history={history} />

                        {/* Recent Activity */}
                        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <History className="h-5 w-5 text-primary" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RecentActivityList history={history} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Insights Section */}
                    {showInsights && insights.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {insights.map((insight, idx) => (
                                <InsightCard key={idx} {...insight} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="engagement" className="space-y-6 mt-6">
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                User Engagement Metrics
                            </CardTitle>
                            <CardDescription className="text-white/40">Community and engagement statistics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EngagementMetrics history={history} />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <PieChart className="h-5 w-5 text-primary" />
                                    Activity Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] flex justify-center items-center">
                                <ActivityBreakdownChart />
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <ChartNoAxesColumn className="h-5 w-5 text-primary" />
                                    Growth Trends
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] flex justify-center items-center">
                                <div className="w-full h-full flex items-center justify-center text-white/40">
                                    Growth trend visualization
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="detailed" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard
                            title="Total Activities"
                            value={analyticsData.totalActivities.value}
                            change={analyticsData.totalActivities.change}
                            description="All time"
                            icon={Activity}
                        />
                        <StatCard
                            title="Conversions"
                            value={analyticsData.totalConversions.value}
                            change={analyticsData.totalConversions.change}
                            description="Total conversions"
                            icon={ArrowRight}
                        />
                        <StatCard
                            title="Calculations"
                            value={analyticsData.calculatorOps.value}
                            change={analyticsData.calculatorOps.change}
                            description="Total calculations"
                            icon={Calendar}
                        />
                        <StatCard
                            title="Peak Time"
                            value={analyticsData.mostActiveHour.value}
                            description={analyticsData.mostActiveHour.description}
                            icon={Clock}
                        />
                        <StatCard
                            title="Favorites"
                            value={analyticsData.favoriteConversions.value}
                            description="Saved items"
                            icon={Target}
                        />
                        <StatCard
                            title="Avg / Day"
                            value={analyticsData.avgPerDay.value}
                            description="Daily average"
                            icon={Activity}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
