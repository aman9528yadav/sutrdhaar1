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
        <div className="space-y-6 h-full flex flex-col pb-20">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        My Tasks
                    </h1>
                    <p className="text-muted-foreground mt-1">Stay organized and productive</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        <Flame className="w-3 h-3 mr-1" />
                        {productivityMetrics.streak} day streak
                    </Badge>
                </div>
            </div>
            
            {/* Productivity Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-4 h-4 text-indigo-500" />
                                    <p className="text-sm font-medium text-muted-foreground">Today's Progress</p>
                                </div>
                                <p className="text-2xl font-bold text-indigo-500">{stats.today}/{stats.active}</p>
                                <p className="text-xs text-muted-foreground mt-1">tasks due today</p>
                            </div>
                            <div className="p-3 rounded-full bg-indigo-500/20 flex-shrink-0">
                                <Sunrise className="h-6 w-6 text-indigo-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="w-4 h-4 text-emerald-500" />
                                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                                </div>
                                <p className="text-2xl font-bold text-emerald-500">{stats.completionRate.toFixed(0)}%</p>
                                <p className="text-xs text-muted-foreground mt-1">of all tasks</p>
                            </div>
                            <div className="p-3 rounded-full bg-emerald-500/20 flex-shrink-0">
                                <Award className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-4 h-4 text-amber-500" />
                                    <p className="text-sm font-medium text-muted-foreground">Focus Score</p>
                                </div>
                                <p className="text-2xl font-bold text-amber-500">{productivityMetrics.focusScore.toFixed(0)}</p>
                                <p className="text-xs text-muted-foreground mt-1">productivity level</p>
                            </div>
                            <div className="p-3 rounded-full bg-amber-500/20 flex-shrink-0">
                                <Zap className="h-6 w-6 text-amber-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Smart Filters */}
            <Card className="bg-card/50 border-white/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        Smart Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={filter === 'all' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('all')}
                            className="transition-all"
                        >
                            All ({stats.total})
                        </Button>
                        <Button
                            variant={filter === 'active' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('active')}
                            className="transition-all border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                        >
                            <Clock className="w-3 h-3 mr-1" />
                            Active ({stats.active})
                        </Button>
                        <Button
                            variant={filter === 'completed' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('completed')}
                            className="transition-all border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                        >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completed ({stats.completed})
                        </Button>
                        <Button
                            variant={filter === 'overdue' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('overdue')}
                            className="transition-all border-red-500/30 text-red-500 hover:bg-red-500/10"
                        >
                            <Flag className="w-3 h-3 mr-1" />
                            Overdue ({stats.overdue})
                        </Button>
                        <Button
                            variant={filter === 'today' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter('today')}
                            className="transition-all border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                        >
                            <Sunset className="w-3 h-3 mr-1" />
                            Today ({stats.today})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Search and Actions */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-card/50 border-white/10"
                        />
                    </div>
                    <Button 
                        onClick={handleCreateTodo} 
                        className="shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Task
                    </Button>
                </div>
            </div>

            {/* Todo List */}
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
                <AnimatePresence mode="popLayout">
                    {filteredTodos.map(todo => (
                        <motion.div
                            key={todo.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                "group flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-card/50 transition-all hover:bg-card/80 hover:shadow-md",
                                todo.completed && "opacity-60 bg-card/30",
                                todo.starred && "border-yellow-500/30 bg-yellow-500/5"
                            )}
                        >
                            <button
                                onClick={() => handleToggleComplete(todo)}
                                className={cn(
                                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    todo.completed
                                        ? "bg-primary border-primary text-primary-foreground scale-110"
                                        : "border-muted-foreground hover:border-primary hover:scale-110"
                                )}
                            >
                                {todo.completed && <CheckCircle2 className="w-4 h-4" />}
                            </button>

                            <button
                                onClick={() => handleToggleStar(todo)}
                                className={cn(
                                    "flex-shrink-0 transition-all",
                                    todo.starred ? "text-yellow-500 scale-110" : "text-muted-foreground hover:text-yellow-500 opacity-0 group-hover:opacity-100"
                                )}
                            >
                                <Star className={cn("w-4 h-4", todo.starred && "fill-current")} />
                            </button>

                            <div className="flex-1 min-w-0" onClick={() => handleEditTodo(todo)}>
                                <p className={cn(
                                    "font-medium truncate transition-all cursor-pointer hover:text-primary",
                                    todo.completed && "line-through text-muted-foreground"
                                )}>
                                    {todo.text}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                    {todo.dueDate && (
                                        <span className={cn(
                                            "flex items-center gap-1 px-2 py-0.5 rounded-full",
                                            !todo.completed && isPast(new Date(todo.dueDate)) && !isToday(new Date(todo.dueDate)) && "text-red-500 bg-red-500/10",
                                            !todo.completed && isToday(new Date(todo.dueDate)) && "text-yellow-500 bg-yellow-500/10"
                                        )}>
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(todo.dueDate)}
                                        </span>
                                    )}
                                    <span className={cn(
                                        "flex items-center gap-1 capitalize px-2 py-0.5 rounded-full",
                                        todo.priority === 'high' && "text-red-400 bg-red-400/10",
                                        todo.priority === 'medium' && "text-yellow-400 bg-yellow-400/10",
                                        todo.priority === 'low' && "text-green-400 bg-green-400/10"
                                    )}>
                                        <Flag className="w-3 h-3" />
                                        {todo.priority}
                                    </span>
                                    {todo.category && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-blue-400 bg-blue-400/10">
                                            <Tag className="w-3 h-3" />
                                            {todo.category}
                                        </span>
                                    )}
                                    {todo.subtasks && todo.subtasks.length > 0 && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-purple-400 bg-purple-400/10">
                                            <ListTodo className="w-3 h-3" />
                                            {todo.subtasks.filter(st => st.completed).length}/{todo.subtasks.length}
                                        </span>
                                    )}
                                    {todo.timeSpent && todo.timeSpent > 0 && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-orange-400 bg-orange-400/10">
                                            <Clock className="w-3 h-3" />
                                            {formatTimeSpent(todo.timeSpent)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="sr-only">Open menu</span>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditTodo(todo)}>
                                        <Edit2 className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleStar(todo)}>
                                        <Star className="mr-2 h-4 w-4" />
                                        {todo.starred ? 'Unstar' : 'Star'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(todo.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredTodos.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
                        <ListTodo className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg font-semibold">No tasks found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or create a new task</p>
                    </div>
                )}
            </div>

            <AddTodoDialog
                open={isDialogOpen}
                onOpenChange={handleDialogOpenChange}
                todo={selectedTodo}
            />
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