"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useProfile, TodoItem } from '@/context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, CheckCircle2, Calendar, Flag, Trash2, Edit2,
    Filter, SortAsc, Star, Clock, TrendingUp, CheckCheck, ListTodo,
    MoreVertical, Tag, Sparkles, Target, Trophy, Flame, Zap,
    Brain, Lightbulb, Award, Crown, Medal, Fire, Sunrise, Sunset
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AddTodoDialog } from './add-todo-dialog';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isTomorrow, isThisWeek, differenceInDays } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import { useSearchParams, useRouter } from 'next/navigation';

export function TodoPageModern() {
    const { profile, addTodo, updateTodo, deleteTodo } = useProfile();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'overdue' | 'today'>('all');
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>('created');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<TodoItem | undefined>(undefined);

    const searchParams = useSearchParams();
    const router = useRouter();

    // Check for edit mode from URL
    useEffect(() => {
        const todoId = searchParams.get('id');
        if (todoId) {
            const todo = profile.todos.find(t => t.id === todoId);
            if (todo) {
                setSelectedTodo(todo);
                setIsDialogOpen(true);
            }
        }
    }, [searchParams, profile.todos]);

    const handleDialogOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('id');
            router.replace(`?${params.toString()}`, { scroll: false });
            setSelectedTodo(undefined);
        }
    };

    // Statistics
    const stats = useMemo(() => {
        const total = profile.todos.length;
        const completed = profile.todos.filter(t => t.completed).length;
        const active = total - completed;
        const overdue = profile.todos.filter(t =>
            !t.completed && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
        ).length;
        const today = profile.todos.filter(t =>
            !t.completed && t.dueDate && isToday(new Date(t.dueDate))
        ).length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        return { total, completed, active, overdue, today, completionRate };
    }, [profile.todos]);

    // Productivity metrics
    const productivityMetrics = useMemo(() => {
        const completedToday = profile.todos.filter(t => 
            t.completed && t.completedAt && isToday(new Date(t.completedAt))
        ).length;
        
        const streak = profile.todos.filter(t => 
            t.completed && t.completedAt && 
            differenceInDays(new Date(), new Date(t.completedAt)) <= 7
        ).length;
        
        const focusScore = stats.total > 0 ? 
            Math.min(100, (stats.completed / stats.total) * 100 + (streak * 2)) : 0;
        
        return { completedToday, streak, focusScore };
    }, [profile.todos, stats]);

    const uniqueCategories = useMemo(() => {
        const categories = new Set<string>();
        profile.todos.forEach(todo => {
            if (todo.category) categories.add(todo.category);
        });
        return Array.from(categories);
    }, [profile.todos]);

    const filteredTodos = useMemo(() => {
        let filtered = [...profile.todos];

        // Apply filters
        if (filter === 'active') {
            filtered = filtered.filter(t => !t.completed);
        } else if (filter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        } else if (filter === 'overdue') {
            filtered = filtered.filter(t =>
                !t.completed && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
            );
        } else if (filter === 'today') {
            filtered = filtered.filter(t =>
                !t.completed && t.dueDate && isToday(new Date(t.dueDate))
            );
        }

        // Apply priority filter
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(t => t.priority === priorityFilter);
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        // Apply search
        if (searchQuery.trim()) {
            filtered = filtered.filter(t =>
                t.text.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply sorting
        return filtered
            .sort((a, b) => {
                switch (sortBy) {
                    case 'priority':
                        const priorityOrder = { high: 0, medium: 1, low: 2 };
                        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                            return priorityOrder[a.priority] - priorityOrder[b.priority];
                        }
                        break;
                    case 'dueDate':
                        if (a.dueDate && b.dueDate) {
                            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                        }
                        if (a.dueDate) return -1;
                        if (b.dueDate) return 1;
                        break;
                    case 'created':
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
                return 0;
            });
    }, [profile.todos, searchQuery, filter, priorityFilter, categoryFilter, sortBy]);

    const handleCreateTodo = () => {
        setSelectedTodo(undefined);
        setIsDialogOpen(true);
    };

    const handleEditTodo = (todo: TodoItem) => {
        setSelectedTodo(todo);
        setIsDialogOpen(true);
    };

    const handleToggleComplete = (todo: TodoItem) => {
        updateTodo({
            ...todo,
            completed: !todo.completed,
            completedAt: !todo.completed ? new Date().toISOString() : undefined
        });
    };

    const handleToggleStar = (todo: TodoItem) => {
        updateTodo({
            ...todo,
            starred: !todo.starred
        });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTodo(id);
        }
    };

    const handleCompleteAll = () => {
        const activeTodos = profile.todos.filter(t => !t.completed);
        activeTodos.forEach(todo => {
            updateTodo({
                ...todo,
                completed: true,
                completedAt: new Date().toISOString()
            });
        });
    };

    const handleDeleteCompleted = () => {
        if (confirm('Are you sure you want to delete all completed tasks?')) {
            const completedTodos = profile.todos.filter(t => t.completed);
            completedTodos.forEach(todo => deleteTodo(todo.id));
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-24">
            {/* Background glowing orbs */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -z-10" />
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -z-10" />

            <div className="w-full max-w-md mx-auto space-y-5 pt-6 px-4 h-full flex flex-col">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                            My Tasks
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Stay organized and productive</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-bold px-3 py-1">
                            <Flame className="w-3.5 h-3.5 mr-1.5" />
                            {productivityMetrics.streak} day streak
                        </Badge>
                    </div>
                </div>

                {/* Compact Productivity Dashboard */}
                <Card className="bg-card/70 backdrop-blur-xl border border-border/50 shadow-md rounded-3xl overflow-hidden shrink-0">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-500">
                                    <Target className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Today's Progress</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-foreground leading-none">{stats.today}</span>
                                        <span className="text-sm font-medium text-muted-foreground">/ {stats.active}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="h-10 w-[1px] bg-border/50"></div>

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Focus Score</p>
                                    <div className="flex items-baseline gap-1 justify-end">
                                        <span className="text-2xl font-black text-amber-500 leading-none">{productivityMetrics.focusScore.toFixed(0)}</span>
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-500">
                                    <Zap className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                <span>Completion Rate</span>
                                <span>{stats.completionRate.toFixed(0)}%</span>
                            </div>
                            <Progress value={stats.completionRate} className="h-2.5 bg-secondary" />
                        </div>
                    </CardContent>
                </Card>

                {/* Search and Filters */}
                <div className="space-y-3 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12 bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm focus-visible:ring-primary text-sm font-medium placeholder:text-muted-foreground/50"
                        />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
                        <Button
                            variant={filter === 'all' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('all')}
                            className={cn("rounded-full h-8 px-4 text-xs font-bold transition-all shrink-0", filter === 'all' ? "shadow-md" : "bg-card/50 border-border/50")}
                        >
                            All ({stats.total})
                        </Button>
                        <Button
                            variant={filter === 'active' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('active')}
                            className={cn("rounded-full h-8 px-4 text-xs font-bold transition-all shrink-0", filter === 'active' ? "bg-blue-500 text-white shadow-md hover:bg-blue-600 border-none" : "bg-card/50 border-border/50 text-blue-500")}
                        >
                            <Clock className="w-3 h-3 mr-1.5" />
                            Active ({stats.active})
                        </Button>
                        <Button
                            variant={filter === 'completed' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('completed')}
                            className={cn("rounded-full h-8 px-4 text-xs font-bold transition-all shrink-0", filter === 'completed' ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600 border-none" : "bg-card/50 border-border/50 text-emerald-500")}
                        >
                            <CheckCircle2 className="w-3 h-3 mr-1.5" />
                            Completed ({stats.completed})
                        </Button>
                        <Button
                            variant={filter === 'today' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('today')}
                            className={cn("rounded-full h-8 px-4 text-xs font-bold transition-all shrink-0", filter === 'today' ? "bg-yellow-500 text-white shadow-md hover:bg-yellow-600 border-none" : "bg-card/50 border-border/50 text-yellow-500")}
                        >
                            <Sunset className="w-3 h-3 mr-1.5" />
                            Today ({stats.today})
                        </Button>
                        <Button
                            variant={filter === 'overdue' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('overdue')}
                            className={cn("rounded-full h-8 px-4 text-xs font-bold transition-all shrink-0", filter === 'overdue' ? "bg-red-500 text-white shadow-md hover:bg-red-600 border-none" : "bg-card/50 border-border/50 text-red-500")}
                        >
                            <Flag className="w-3 h-3 mr-1.5" />
                            Overdue ({stats.overdue})
                        </Button>
                    </div>
                </div>

                {/* Todo List */}
                <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
                    <AnimatePresence mode="popLayout">
                        {filteredTodos.map(todo => (
                            <motion.div
                                key={todo.id}
                                layout
                                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                className={cn(
                                    "group flex items-start gap-3 p-4 rounded-3xl border shadow-sm transition-all relative overflow-hidden",
                                    todo.completed ? "bg-card/30 border-border/30 opacity-70" : "bg-card/70 backdrop-blur-xl border-border/50",
                                    todo.starred && !todo.completed && "border-yellow-500/30 bg-yellow-500/5 shadow-yellow-500/5"
                                )}
                            >
                                <button
                                    onClick={() => handleToggleComplete(todo)}
                                    className={cn(
                                        "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 relative",
                                        todo.completed
                                            ? "bg-primary border-primary text-primary-foreground scale-110 shadow-sm"
                                            : "border-muted-foreground/40 hover:border-primary hover:scale-110 hover:bg-primary/10"
                                    )}
                                >
                                    <AnimatePresence>
                                        {todo.completed && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>

                                <div className="flex-1 min-w-0 pt-0.5 cursor-pointer" onClick={() => handleEditTodo(todo)}>
                                    <p className={cn(
                                        "font-semibold transition-all hover:text-primary leading-tight",
                                        todo.completed ? "line-through text-muted-foreground" : "text-foreground text-[15px]"
                                    )}>
                                        {todo.text}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-muted-foreground flex-wrap">
                                        {todo.dueDate && (
                                            <span className={cn(
                                                "flex items-center gap-1 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5",
                                                !todo.completed && isPast(new Date(todo.dueDate)) && !isToday(new Date(todo.dueDate)) && "text-red-500 bg-red-500/10",
                                                !todo.completed && isToday(new Date(todo.dueDate)) && "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10"
                                            )}>
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(todo.dueDate)}
                                            </span>
                                        )}
                                        <span className={cn(
                                            "flex items-center gap-1 px-2 py-1 rounded-lg uppercase tracking-wider",
                                            todo.priority === 'high' ? "text-red-500 bg-red-500/10" :
                                            todo.priority === 'medium' ? "text-amber-500 bg-amber-500/10" :
                                            "text-emerald-500 bg-emerald-500/10"
                                        )}>
                                            <Flag className="w-3 h-3" />
                                            {todo.priority}
                                        </span>
                                        {todo.category && (
                                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-indigo-500 bg-indigo-500/10 capitalize">
                                                <Tag className="w-3 h-3" />
                                                {todo.category}
                                            </span>
                                        )}
                                        {todo.subtasks && todo.subtasks.length > 0 && (
                                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-purple-500 bg-purple-500/10">
                                                <ListTodo className="w-3 h-3" />
                                                {todo.subtasks.filter(st => st.completed).length}/{todo.subtasks.length}
                                            </span>
                                        )}
                                        {todo.timeSpent && todo.timeSpent > 0 && (
                                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-orange-500 bg-orange-500/10">
                                                <Clock className="w-3 h-3" />
                                                {formatTimeSpent(todo.timeSpent)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-between gap-2 h-full">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleStar(todo);
                                        }}
                                        className={cn(
                                            "flex-shrink-0 transition-all p-1",
                                            todo.starred ? "text-yellow-500 scale-110" : "text-muted-foreground/30 hover:text-yellow-500"
                                        )}
                                    >
                                        <Star className={cn("w-5 h-5", todo.starred && "fill-current")} />
                                    </button>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 opacity-50 hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-2xl bg-popover/95 backdrop-blur-xl shadow-xl border-border/50">
                                            <DropdownMenuItem onClick={() => handleEditTodo(todo)} className="rounded-xl mx-1 my-1 cursor-pointer font-medium">
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                Edit Task
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStar(todo)} className="rounded-xl mx-1 my-1 cursor-pointer font-medium">
                                                <Star className="mr-2 h-4 w-4" />
                                                {todo.starred ? 'Remove Star' : 'Add Star'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-border/50" />
                                            <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-xl mx-1 my-1 cursor-pointer font-medium" onClick={() => handleDelete(todo.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Task
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredTodos.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <ListTodo className="h-10 w-10 text-primary opacity-50" />
                            </div>
                            <p className="text-xl font-bold text-foreground">No tasks found</p>
                            <p className="text-sm mt-1 max-w-[250px] text-center">You're all caught up! Time to relax or create a new task.</p>
                        </div>
                    )}
                </div>

                {/* Floating Action Button (FAB) */}
                <div className="fixed bottom-24 right-4 z-[90] sm:bottom-6 sm:right-6">
                    <Button 
                        size="icon"
                        onClick={handleCreateTodo} 
                        className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95 border-4 border-background"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>

                <AddTodoDialog
                    open={isDialogOpen}
                    onOpenChange={handleDialogOpenChange}
                    todo={selectedTodo}
                />
            </div>
        </div>
    );
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
}

function formatTimeSpent(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}