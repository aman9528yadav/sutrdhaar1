"use client";

import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { MagicEntry } from '@/components/magic-entry';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Flame, CheckSquare, BookText, ArrowRight,
    Calculator, Calendar, Wallet, CreditCard, ArrowRightLeft, Star, Plus, AlertCircle, Activity, Trash2, Trophy,
    Timer, Lock, Sparkles, TrendingUp, TrendingDown, ChevronRight, Info, Heart, User, Shield, Zap, Clock, Search, ShieldAlert
} from 'lucide-react';
import { format, isToday, subDays, startOfDay, isSameDay } from 'date-fns';
import { DashboardWidgetItem } from '@/context/ProfileContext';
import { useChangelog } from '@/hooks/useChangelog';
import { useMaintenance } from '@/hooks/useMaintenance';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface DashboardPageProps {
    onToolSelect: (toolId: string) => void;
    onOpenSearch?: () => void;
}

// ─── 3D Tilt Card Component ───
function TiltCard({ children, className, onClick, glareColor = 'rgba(255,255,255,0.15)' }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    glareColor?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0.5);
    const y = useMotionValue(0.5);

    const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 300, damping: 30 });
    const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 300, damping: 30 });

    const glareX = useTransform(x, [0, 1], ['-50%', '150%']);
    const glareY = useTransform(y, [0, 1], ['-50%', '150%']);

    const handleMouse = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width);
        y.set((e.clientY - rect.top) / rect.height);
    }, [x, y]);

    const handleLeave = useCallback(() => {
        x.set(0.5);
        y.set(0.5);
    }, [x, y]);

    return (
        <motion.div
            ref={ref}
            className={className}
            style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
                perspective: '1000px',
            }}
            onMouseMove={handleMouse}
            onMouseLeave={handleLeave}
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
        >
            <div style={{ transform: 'translateZ(0)', position: 'relative' }}>
                {children}
                {/* Glare overlay */}
                <motion.div
                    className="pointer-events-none absolute inset-0 rounded-2xl z-20"
                    style={{
                        background: `radial-gradient(circle at var(--glare-x) var(--glare-y), ${glareColor} 0%, transparent 60%)`,
                        '--glare-x': glareX,
                        '--glare-y': glareY,
                    } as React.CSSProperties}
                />
            </div>
        </motion.div>
    );
}

// ─── Donut Chart Component ───
function SpendingDonut({ spent, limit }: { spent: number; limit: number }) {
    const percentage = Math.min((spent / limit) * 100, 100);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const isOver = spent > limit;

    return (
        <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--border) / 0.3)" strokeWidth="8" />
                <motion.circle
                    cx="50" cy="50" r={radius} fill="none"
                    stroke={isOver ? 'hsl(0, 70%, 55%)' : 'hsl(150, 60%, 45%)'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-sm font-extrabold leading-none ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>
                    {Math.round(percentage)}%
                </span>
                <span className="text-[9px] text-muted-foreground mt-0.5">used</span>
            </div>
        </div>
    );
}

// ─── Activity Heatmap ───
function WeeklyHeatmap({ activityLog }: { activityLog: { timestamp: string }[] }) {
    const days = useMemo(() => {
        const result = [];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        for (let i = 6; i >= 0; i--) {
            const day = subDays(new Date(), i);
            const dayStart = startOfDay(day);
            const count = activityLog.filter(a => isSameDay(new Date(a.timestamp), dayStart)).length;
            result.push({ name: dayNames[(day.getDay() + 6) % 7], count, date: day });
        }
        return result;
    }, [activityLog]);

    const maxCount = Math.max(...days.map(d => d.count), 1);

    return (
        <div className="flex items-end gap-2 justify-between w-full px-1">
            {days.map((day, idx) => {
                const intensity = day.count / maxCount;
                const height = Math.max(8, intensity * 48);
                return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                        <motion.div
                            className="w-full rounded-lg min-h-[8px]"
                            style={{
                                background: day.count === 0
                                    ? 'hsl(var(--border) / 0.3)'
                                    : `hsl(var(--primary) / ${0.3 + intensity * 0.7})`,
                            }}
                            initial={{ height: 0 }}
                            animate={{ height }}
                            transition={{ duration: 0.6, delay: idx * 0.08, ease: 'easeOut' }}
                        />
                        <span className={`text-[10px] font-medium ${isToday(day.date) ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                            {isToday(day.date) ? 'Today' : day.name}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}


// ─── Banner Slider ───
function BannerSlider({ membershipStatus, dailyInsight }: { membershipStatus: any, dailyInsight: any }) {
    const [index, setIndex] = useState(0);
    
    const banners = [];
    
    if (membershipStatus) {
        banners.push(
            <div key="membership" className={`p-4 rounded-xl bg-gradient-to-r ${membershipStatus.color} border ${membershipStatus.border} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/10 backdrop-blur-sm ${membershipStatus.textColor}`}>
                        <membershipStatus.icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-sm text-foreground">{membershipStatus.text}</span>
                </div>
            </div>
        );
    }

    banners.push(
        <a key="offline" href="/offline-app/index.html" target="_blank" rel="noopener noreferrer" className="block outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl w-full">
            <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between shadow-sm transition-transform hover:scale-[1.02] w-full">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600"><path d="M10.5 22H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7.5"/><path d="M8 12h8"/><path d="M8 8h10"/><path d="m16 19 2 2 4-4"/></svg>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-foreground text-sm truncate">Offline Mode</h3>
                        <p className="text-xs text-muted-foreground truncate">Access your tools without internet</p>
                    </div>
                </div>
                <Button size="icon" variant="ghost" className="rounded-full bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 pointer-events-none shrink-0 h-8 w-8 ml-2">
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </a>
    );

    if (dailyInsight) {
        banners.push(
            <div key="insight" className={`relative overflow-hidden rounded-2xl border ${dailyInsight.border} bg-gradient-to-r ${dailyInsight.color} backdrop-blur-md p-4 shadow-sm w-full h-full flex flex-col justify-center`}>
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-11 h-11 rounded-xl bg-background/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-2xl shrink-0">
                        {dailyInsight.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">Daily Insight</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{dailyInsight.text}</p>
                    </div>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % banners.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [banners.length]);

    if (banners.length === 0) return null;

    return (
        <div className="relative overflow-hidden w-full rounded-2xl min-h-[72px]">
            <motion.div 
                className="flex h-full"
                animate={{ x: `-${index * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {banners.map((banner, i) => (
                    <div key={i} className="w-full shrink-0 flex items-stretch">
                        {banner}
                    </div>
                ))}
            </motion.div>
            
            {banners.length > 1 && (
                <div className="absolute top-2 right-4 flex justify-center gap-1.5 z-20">
                    {banners.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-foreground/50 scale-125' : 'bg-foreground/20'}`} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function DashboardPage({ onToolSelect, onOpenSearch }: DashboardPageProps) {
    const { profile, updateDashboardLayout, updateWidgetVisibility, updateWidgetSize, updateTodo, deleteTodo } = useProfile();
    const { maintenance } = useMaintenance();
    const { globalNotifications, version } = useChangelog();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isPromoBannerDismissed, setIsPromoBannerDismissed] = useState(false);

    const isLayoutHidden = (id: string) => profile.settings?.dashboardLayout?.find(item => item.id === id)?.hidden ?? false;

    // Widget visibility helper
    const isWidgetVisible = useCallback((widgetId: string) => {
        const widgets = profile.dashboardWidgets;
        if (!widgets || widgets.length === 0) return true;
        const widget = widgets.find(w => w.id === widgetId);
        return widget ? !widget.hidden : true;
    }, [profile.dashboardWidgets]);

    // Daily tasks
    const todayTodos = useMemo(() => {
        return profile.todos.filter(t => !t.completed && (!t.dueDate || isToday(new Date(t.dueDate))));
    }, [profile.todos]);

    const completedTodos = useMemo(() => {
        return profile.todos.filter(t => t.completed);
    }, [profile.todos]);

    const pendingTodos = useMemo(() => {
        return profile.todos.filter(t => !t.completed).slice(0, 5);
    }, [profile.todos]);

    const progressPercent = useMemo(() => {
        const total = profile.todos.length;
        if (total === 0) return 0;
        return Math.round((completedTodos.length / total) * 100);
    }, [profile.todos, completedTodos]);

    // Recent items
    const recentFavorites = useMemo(() => {
        return profile.favorites.slice(0, 3);
    }, [profile.favorites]);

    // XP progress to next level
    const xpForCurrentLevel = useMemo(() => {
        const level = profile.stats.level || 1;
        return (level - 1) * (level - 1) * 100;
    }, [profile.stats.level]);

    const xpForNextLevel = useMemo(() => {
        const level = profile.stats.level || 1;
        return level * level * 100;
    }, [profile.stats.level]);

    const xpProgress = useMemo(() => {
        const xp = profile.stats.xp || 0;
        const range = xpForNextLevel - xpForCurrentLevel;
        if (range === 0) return 0;
        return Math.min(100, Math.round(((xp - xpForCurrentLevel) / range) * 100));
    }, [profile.stats.xp, xpForCurrentLevel, xpForNextLevel]);

    // Daily Insight generation
    const dailyInsight = useMemo(() => {
        const totalTasks = profile.todos.length;
        const completedCount = completedTodos.length;
        const streak = profile.stats.streak || 0;
        const todayActivities = profile.stats.todayActivities || 0;
        const totalTransactions = profile.budget.transactions.length;

        const todayExpenses = profile.budget.transactions
            .filter(t => t.type === 'expense' && isToday(new Date(t.date)))
            .reduce((sum, t) => sum + t.amount, 0);
        const todayIncome = profile.budget.transactions
            .filter(t => t.type === 'income' && isToday(new Date(t.date)))
            .reduce((sum, t) => sum + t.amount, 0);

        if (streak >= 7) return { emoji: '🔥', text: `${streak}-day streak! You're unstoppable!`, color: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30' };
        if (completedCount > 0 && completedCount === totalTasks) return { emoji: '🎯', text: 'All tasks completed! You nailed it today!', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30' };
        if (todayIncome > todayExpenses && todayIncome > 0) return { emoji: '💰', text: `You earned ₹${todayIncome - todayExpenses} more than you spent today!`, color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30' };
        if (todayActivities >= 5) return { emoji: '⚡', text: `${todayActivities} activities today! Super productive!`, color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30' };
        if (totalTasks > 0 && completedCount > totalTasks / 2) return { emoji: '📈', text: `${Math.round((completedCount / totalTasks) * 100)}% of tasks done. Keep pushing!`, color: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/30' };
        if (streak >= 3) return { emoji: '✨', text: `${streak} days in a row! Building momentum.`, color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' };
        return { emoji: '👋', text: 'Start your day strong — open a tool or complete a task!', color: 'from-primary/10 to-purple-500/10', border: 'border-primary/20' };
    }, [profile, completedTodos]);

    // Budget data
    const todayExpenses = useMemo(() => {
        return profile.budget.transactions
            .filter(t => t.type === 'expense' && isToday(new Date(t.date)))
            .reduce((sum, t) => sum + t.amount, 0);
    }, [profile.budget.transactions]);

    const activeBudget = useMemo(() => {
        return profile.budget?.limits?.[0] || null;
    }, [profile.budget?.limits]);

    const totalBalance = useMemo(() => {
        return profile.budget.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    }, [profile.budget.accounts]);

    const recentActivities = useMemo(() => {
        if (!profile.history || profile.history.length === 0) return [];
        return profile.history.slice(0, 3);
    }, [profile.history]);

    const recentFavorite = useMemo(() => {
        if (profile.favorites.length === 0) return null;
        return profile.favorites[0];
    }, [profile.favorites]);

    const budgetLimit = 2000;

    // Membership Status Banner
    const membershipStatus = useMemo(() => {
        const now = Date.now();
        if (profile.email === 'amanyadavyadav9458@gmail.com') {
            return { type: 'admin', text: 'Admin Access Active', color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30', icon: Shield, textColor: 'text-blue-500' };
        }
        if (profile.membership === 'standard' || profile.membership === 'premium') {
            let remainText = '';
            if (profile.membershipExpiresAt) {
                const expires = new Date(profile.membershipExpiresAt).getTime();
                const diffDays = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
                if (diffDays > 0) remainText = ` • ${diffDays} days remaining`;
                else remainText = ' • Expired';
            }
            const isPremium = profile.membership === 'premium';
            return { 
                type: 'membership', 
                text: `${isPremium ? 'Premium' : 'Standard'} Membership Active${remainText}`, 
                color: isPremium ? 'from-purple-500/20 to-pink-500/20' : 'from-indigo-500/20 to-blue-500/20', 
                border: isPremium ? 'border-purple-500/30' : 'border-indigo-500/30', 
                icon: isPremium ? Zap : Star,
                textColor: isPremium ? 'text-purple-500' : 'text-indigo-500'
            };
        }
        if (profile.trialClaimedAt) {
            const expires = new Date(profile.trialClaimedAt).getTime() + (24 * 60 * 60 * 1000);
            const diffHours = Math.floor((expires - now) / (1000 * 60 * 60));
            const diffMins = Math.floor(((expires - now) % (1000 * 60 * 60)) / (1000 * 60));
            if (expires > now) {
                return { type: 'trial', text: `Free Trial Active • ${diffHours}h ${diffMins}m remaining`, color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', icon: Clock, textColor: 'text-emerald-500' };
            }
        }
        return null;
    }, [profile]);

    // Quick action items
    const quickActions = [
        { id: 'calculator', label: 'Calculator', icon: Calculator, gradient: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-500/20' },
        { id: 'converter', label: 'Converter', icon: ArrowRightLeft, gradient: 'from-violet-500 to-purple-400', shadow: 'shadow-violet-500/20' },
        { id: 'timer', label: 'Timer', icon: Timer, gradient: 'from-orange-500 to-amber-400', shadow: 'shadow-orange-500/20' },
        { id: 'notes', label: 'Notes', icon: BookText, gradient: 'from-yellow-500 to-lime-400', shadow: 'shadow-yellow-500/20' },
        { id: 'budget-tracker', label: 'Budget', icon: Wallet, gradient: 'from-emerald-500 to-teal-400', shadow: 'shadow-emerald-500/20' },
        { id: 'password-generator', label: 'Password', icon: Lock, gradient: 'from-rose-500 to-pink-400', shadow: 'shadow-rose-500/20' },
    ];

    // Recent notes
    const recentNotes = useMemo(() => {
        return profile.notes
            .filter(n => !n.isTrashed && !n.isArchived)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 4);
    }, [profile.notes]);

    // Stagger animation
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
    };

    // FAB actions
    const fabActions = [
        { icon: CheckSquare, color: 'bg-green-500 hover:bg-green-600', tool: 'todo', label: 'Task', angle: -135 },
        { icon: BookText, color: 'bg-blue-500 hover:bg-blue-600', tool: 'notes', label: 'Note', angle: -90 },
        { icon: CreditCard, color: 'bg-red-500 hover:bg-red-600', tool: 'budget-tracker', label: 'Budget', angle: -45 },
    ];

    return (
        <motion.div
            className="space-y-6 h-full flex flex-col pb-6 max-w-3xl mx-auto w-full px-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >


            {/* ── Promo Banner (NEW) ── */}
            {!isPromoBannerDismissed && profile.membership !== 'premium' && profile.membership !== 'standard' && (
                <motion.div variants={itemVariants} className="pt-2">
                    <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 shadow-lg">
                        <div className="relative bg-background/95 backdrop-blur-xl rounded-[15px] p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-amber-500/20">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm bg-gradient-to-r from-purple-500 to-amber-500 bg-clip-text text-transparent">Elevate your productivity</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Unlock custom themes & AI tools</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-600 hover:to-amber-600 text-white font-bold h-8 text-xs border-none" onClick={() => onToolSelect('membership')}>
                                    Upgrade
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-white/10" onClick={() => setIsPromoBannerDismissed(true)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Magic Entry Bar ── */}
            <motion.div variants={itemVariants} className={isPromoBannerDismissed || profile.membership === 'premium' || profile.membership === 'standard' ? "pt-2" : ""}>
                <MagicEntry />
            </motion.div>

            {/* ── Hero: Profile + XP (KEPT AS-IS) ── */}
            <motion.div variants={itemVariants}>
                <Card className="relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-br from-primary/20 via-card/60 to-purple-500/10 backdrop-blur-md shadow-lg">
                    {/* Decorative circles */}
                    <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

                    <CardContent className="p-5 relative z-10">
                        {/* Top row: greeting + task ring */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-1">Good day 👋</p>
                                <h1 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight">
                                    {profile.name ? profile.name.split(' ')[0] : 'Welcome'}
                                </h1>
                                <p className="text-muted-foreground text-sm mt-1">Let's crush today's goals!</p>
                            </div>
                            {/* Circular task progress */}
                            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-border/40" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                    <path className="text-primary transition-all duration-1000 ease-out" strokeDasharray={`${progressPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center text-center">
                                    <span className="text-xl font-bold text-foreground leading-none">{completedTodos.length}</span>
                                    <span className="text-[11px] text-muted-foreground font-medium uppercase mt-0.5">/{profile.todos.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Level + XP bar */}
                        <div className="mt-4 p-4 rounded-xl bg-background/30 border border-border/30 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <span className="text-base font-bold text-foreground">Level {profile.stats.level || 1}</span>
                                </div>
                                <span className="text-base font-bold text-purple-400">{profile.stats.xp || 0} XP</span>
                            </div>
                            <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-primary transition-all duration-700 rounded-full"
                                    style={{ width: `${xpProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">{xpProgress}% to Level {(profile.stats.level || 1) + 1}</p>
                        </div>

                        {/* Stats row: Streak · Activity · Tasks */}
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <Flame className="w-5 h-5 text-orange-500 mb-1.5 animate-pulse" />
                                <span className="text-xl font-extrabold text-foreground leading-none">{profile.stats.streak || 0}</span>
                                <span className="text-xs text-muted-foreground mt-1 font-medium">Day Streak</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <Activity className="w-5 h-5 text-blue-500 mb-1.5" />
                                <span className="text-xl font-extrabold text-foreground leading-none">{profile.stats.todayActivities || 0}</span>
                                <span className="text-xs text-muted-foreground mt-1 font-medium">Today</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                <CheckSquare className="w-5 h-5 text-green-500 mb-1.5" />
                                <span className="text-xl font-extrabold text-foreground leading-none">{completedTodos.length}</span>
                                <span className="text-xs text-muted-foreground mt-1 font-medium">Done</span>
                            </div>
                        </div>

                        {/* CTA */}
                        {pendingTodos.length > 0 && (
                            <Button size="sm" className="mt-3 w-full shadow-md" onClick={() => onToolSelect('todo')}>
                                Start Next Task <ArrowRight className="w-4 h-4 ml-1.5" />
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Banners Slider (NEW) ── */}
            <motion.div variants={itemVariants}>
                <BannerSlider membershipStatus={membershipStatus} dailyInsight={dailyInsight} />
            </motion.div>

            {/* ── Quick Actions Grid (NEW) ── */}
            <motion.div variants={itemVariants} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h2>
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => onToolSelect('tools-list')}>
                        View All <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {quickActions.map((action, idx) => (
                        <TiltCard
                            key={action.id}
                            className="cursor-pointer"
                            onClick={() => onToolSelect(action.id)}
                        >
                            <motion.div
                                className={`relative overflow-hidden rounded-2xl border border-border/30 bg-card/60 backdrop-blur-md p-4 flex flex-col items-center gap-2.5 shadow-lg ${action.shadow} hover:shadow-xl transition-shadow duration-300`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15 + idx * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md`}>
                                    <action.icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">{action.label}</span>
                                {/* subtle glow behind icon */}
                                <div className={`absolute top-3 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br ${action.gradient} rounded-full opacity-20 blur-xl pointer-events-none`} />
                            </motion.div>
                        </TiltCard>
                    ))}
                </div>
            </motion.div>

            {/* ── Weekly Activity Heatmap (NEW) ── */}
            {isWidgetVisible('history') && <motion.div variants={itemVariants}>
                <Card className="overflow-hidden rounded-2xl border-border/40 bg-card/50 backdrop-blur-md shadow-sm">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Activity className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <h3 className="font-semibold text-foreground text-sm">This Week</h3>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => onToolSelect('analytics')}>
                                View More <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Button>
                        </div>
                        <WeeklyHeatmap activityLog={profile.activityLog} />
                    </CardContent>
                </Card>
            </motion.div>}

            {/* ── Task Cards (Horizontal Scroll) ── */}
            {isWidgetVisible('todo') && (
                maintenance.tools?.['todo']?.is_maintenance ? (
                    <motion.div variants={itemVariants} className="px-1">
                        <div className="w-full h-24 rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-md border-dashed flex flex-col items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-blue-500/50 mb-1" />
                            <h3 className="text-xs font-semibold text-blue-500">Tasks Upgrading</h3>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div variants={itemVariants} className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Tasks</h2>
                    {profile.todos.filter(t => !t.completed).length > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => onToolSelect('todo')}>
                            View All <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                    )}
                </div>
                <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-hide -mx-4 px-4">
                    {pendingTodos.length > 0 ? pendingTodos.map((todo, idx) => {
                        const priorityColors: Record<string, { bg: string, border: string, dot: string }> = {
                            high: { bg: 'from-red-500/10 to-rose-500/5', border: 'border-red-500/30', dot: 'bg-red-500' },
                            medium: { bg: 'from-amber-500/10 to-yellow-500/5', border: 'border-amber-500/30', dot: 'bg-amber-500' },
                            low: { bg: 'from-blue-500/10 to-cyan-500/5', border: 'border-blue-500/30', dot: 'bg-blue-500' },
                        };
                        const colors = priorityColors[todo.priority] || priorityColors.low;

                        return (
                            <motion.div
                                key={todo.id}
                                className={`relative shrink-0 w-52 rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} backdrop-blur-md p-4 cursor-pointer group hover:scale-[1.02] transition-transform duration-300 shadow-sm`}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + idx * 0.08, duration: 0.5 }}
                                onClick={() => onToolSelect('todo')}
                            >
                                {/* Priority stripe */}
                                <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${colors.dot}`} />
                                <div className="flex items-start gap-2 mb-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} shrink-0 mt-1`} />
                                    <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{todo.text}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground capitalize font-medium">{todo.priority} priority</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500 hover:text-green-600 hover:bg-green-500/10 rounded-lg" onClick={(e) => { e.stopPropagation(); updateTodo({...todo, completed: true, completedAt: new Date().toISOString()}) }}>
                                            <CheckSquare className="w-3 h-3" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg" onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id) }}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                {todo.dueDate && (
                                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(todo.dueDate), 'MMM d')}
                                    </p>
                                )}
                            </motion.div>
                        );
                    }) : (
                        <div className="w-full flex flex-col items-center justify-center py-8 rounded-2xl bg-card/30 border border-dashed border-border/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="text-4xl mb-3"
                            >
                                🎉
                            </motion.div>
                            <p className="text-sm font-semibold text-foreground mb-1">All clear!</p>
                            <p className="text-xs text-muted-foreground mb-3">No pending tasks</p>
                            <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground h-8 text-xs rounded-xl" onClick={() => onToolSelect('todo')}>
                                <Plus className="w-3 h-3 mr-1" /> Add Task
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>
                )
            )}

            {/* ── Spending Pulse & Budget (NEW) ── */}
            {isWidgetVisible('budget') && (
                maintenance.tools?.['budget-tracker']?.is_maintenance ? (
                    <motion.div variants={itemVariants}>
                        <Card className="overflow-hidden rounded-2xl border-blue-500/20 bg-blue-500/5 backdrop-blur-md shadow-sm border-dashed">
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                                <ShieldAlert className="w-8 h-8 text-blue-500/50" />
                                <div>
                                    <h3 className="font-semibold text-sm text-blue-500">Budget Tracker Upgrading</h3>
                                    <p className="text-xs text-muted-foreground mt-1">We are doing some maintenance on this tool.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div variants={itemVariants}>
                        <TiltCard
                            className="cursor-pointer"
                            onClick={() => onToolSelect('budget-tracker')}
                            glareColor="rgba(16, 185, 129, 0.1)"
                        >
                            <Card className="overflow-hidden rounded-2xl border-border/40 bg-card/50 backdrop-blur-md shadow-sm hover:border-emerald-500/40 transition-colors">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                                        </div>
                                        <h3 className="font-semibold text-foreground text-sm">Spending Pulse</h3>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <SpendingDonut spent={todayExpenses} limit={budgetLimit} />
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Balance</p>
                                                <p className={`text-lg font-extrabold ${totalBalance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    ₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-1 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                                    <TrendingDown className="w-3 h-3 text-red-500 mb-0.5" />
                                                    <p className="text-xs font-bold text-foreground">₹{todayExpenses}</p>
                                                    <p className="text-[9px] text-muted-foreground">Spent</p>
                                                </div>
                                                <div className="flex-1 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                    <TrendingUp className="w-3 h-3 text-emerald-500 mb-0.5" />
                                                    <p className="text-xs font-bold text-foreground">₹{budgetLimit - todayExpenses > 0 ? budgetLimit - todayExpenses : 0}</p>
                                                    <p className="text-[9px] text-muted-foreground">Left</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {todayExpenses > budgetLimit && (
                                        <motion.div
                                            className="flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 p-2 rounded-lg mt-3"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                        >
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span className="font-medium">Daily budget exceeded!</span>
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>
                        </TiltCard>
                    </motion.div>
                )
            )}

            {/* ── Notes Carousel (NEW) ── */}
            {isWidgetVisible('notes') && (
                maintenance.tools?.['notes']?.is_maintenance ? (
                    <motion.div variants={itemVariants} className="px-1">
                        <div className="w-full h-24 rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-md border-dashed flex flex-col items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-blue-500/50 mb-1" />
                            <h3 className="text-xs font-semibold text-blue-500">Notes Upgrading</h3>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div variants={itemVariants} className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Notes</h2>
                            <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => onToolSelect('notes')}>
                                All Notes <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Button>
                        </div>
                        <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-hide -mx-4 px-4">
                            {recentNotes.length > 0 ? recentNotes.map((note, idx) => {
                                const noteColors = [
                                    'from-yellow-500/15 to-amber-500/5 border-yellow-500/25',
                                    'from-blue-500/15 to-indigo-500/5 border-blue-500/25',
                                    'from-pink-500/15 to-rose-500/5 border-pink-500/25',
                                    'from-green-500/15 to-emerald-500/5 border-green-500/25',
                                ];
                                const colorClass = noteColors[idx % noteColors.length];

                                return (
                                    <motion.div
                                        key={note.id}
                                        className={`shrink-0 w-44 rounded-2xl border bg-gradient-to-br ${colorClass} backdrop-blur-md p-4 cursor-pointer hover:scale-[1.03] transition-transform duration-300 shadow-sm`}
                                        initial={{ opacity: 0, y: 20, rotate: idx % 2 === 0 ? -2 : 2 }}
                                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                                        transition={{ delay: 0.08 * idx, duration: 0.5 }}
                                        onClick={() => onToolSelect(`notes?id=${note.id}`)}
                                    >
                                        <BookText className="w-4 h-4 text-muted-foreground mb-2" />
                                        <h4 className="text-xs font-bold text-foreground line-clamp-1 mb-1">{note.title || 'Untitled'}</h4>
                                        <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed">{note.content}</p>
                                        <p className="text-[9px] text-muted-foreground/60 mt-2">
                                            {format(new Date(note.updatedAt), 'MMM d')}
                                        </p>
                                    </motion.div>
                                );
                            }) : (
                                <div className="w-full flex flex-col items-center justify-center py-6 rounded-2xl bg-card/30 border border-dashed border-border/50 backdrop-blur-sm">
                                    <BookText className="w-8 h-8 text-muted-foreground/40 mb-2" />
                                    <p className="text-xs text-muted-foreground italic">No notes yet</p>
                                    <Button size="sm" className="mt-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground h-7 text-xs rounded-xl" onClick={() => onToolSelect('notes')}>
                                        <Plus className="w-3 h-3 mr-1" /> Create Note
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )
            )}

            {/* ── Favorites Quick Access ── */}
            {isWidgetVisible('favorites') && recentFavorite && (
                <motion.div variants={itemVariants}>
                    <Card
                        className="overflow-hidden rounded-2xl border-border/40 bg-card/50 backdrop-blur-md shadow-sm cursor-pointer hover:border-amber-500/40 transition-colors"
                        onClick={() => onToolSelect('converter')}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Star className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground text-xs">Favorite Conversion</h3>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {recentFavorite.fromValue} {recentFavorite.fromUnit.split(' ')[0]} = {recentFavorite.toValue} {recentFavorite.toUnit.split(' ')[0]}
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* ── About Me Card (NEW) ── */}
            <motion.div variants={itemVariants}>
                <Card
                    className="overflow-hidden rounded-2xl border-border/40 bg-gradient-to-br from-primary/5 via-card/60 to-purple-500/5 backdrop-blur-md shadow-sm cursor-pointer hover:border-primary/40 transition-all hover:scale-[1.01] group"
                    onClick={() => onToolSelect('about')}
                >
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-primary/20 shadow-md">
                                    <User className="w-6 h-6 text-primary" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-card">
                                    <Heart className="w-2.5 h-2.5 text-white fill-white" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">About Sutradhaar</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Built with ❤️ by Aman Yadav</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">v{version || '1.0.0'}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground">Roadmap • Features • Team</span>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
