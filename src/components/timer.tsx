"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Clock, Zap, Coffee, Maximize2, Minimize2, Plus, Minus, Volume2, VolumeX, Settings, Target, Trophy, Flame, Square, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';
import { useTimer } from '@/context/TimerContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Sub-components ---

type TimerTheme = 'pomodoro' | 'deep_work' | 'break' | 'custom';

const PresetChip = ({ label, timeLabel, active, themeColor, onClick }: { label: string, timeLabel: string, active: boolean, themeColor: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-300 border-2",
            active ? `border-${themeColor}-500 bg-${themeColor}-500/10 scale-105` : "border-border/50 bg-card hover:bg-accent/50"
        )}
    >
        <span className={cn("text-sm font-bold", active ? `text-${themeColor}-500` : "text-foreground")}>{label}</span>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{timeLabel}</span>
    </button>
);

// --- Main Component ---

export function Timer() {
    const { profile, addXP } = useProfile();
    const { toast } = useToast();
    const {
        mode, setMode,
        hours, setHours,
        minutes, setMinutes,
        seconds, setSeconds,
        totalSeconds,
        initialTime,
        isActive,
        isPaused,
        intervalSettings, setIntervalSettings,
        currentRound,
        isWorkPhase,
        selectedTaskId, setSelectedTaskId,
        handleStart,
        handlePauseResume,
        handleReset,
    } = useTimer();

    const [currentTheme, setCurrentTheme] = useState<TimerTheme>('pomodoro');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [editMinutes, setEditMinutes] = useState("");
    const [sessionCompleted, setSessionCompleted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync theme with Timer mode/settings on mount if not active
    useEffect(() => {
        if (!isActive) {
            applyPreset('pomodoro');
        }
    }, []);

    // Smart interruption handling (pause when tab hidden)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isActive && !isPaused) {
                handlePauseResume();
                toast({
                    title: "Session Paused ⏸️",
                    description: "Timer paused while you were away.",
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isActive, isPaused, handlePauseResume, toast]);

    // Session completion trigger
    const prevIsActive = useRef(isActive);
    useEffect(() => {
        if (prevIsActive.current && !isActive && totalSeconds === 0) {
            // Timer just finished naturally
            handleSessionComplete();
        }
        prevIsActive.current = isActive;
    }, [isActive, totalSeconds]);

    const handleSessionComplete = () => {
        setSessionCompleted(true);
        addXP(50); // Give XP for completing a session
        toast({
            title: "Session Complete! 🎉",
            description: "+50 XP gained.",
            variant: "default",
        });
        // Auto hide completion screen after 3s
        setTimeout(() => setSessionCompleted(false), 3000);
    };

    const applyPreset = (theme: TimerTheme) => {
        setCurrentTheme(theme);
        if (theme === 'pomodoro') {
            setMode('interval');
            setIntervalSettings(p => ({ ...p, workMinutes: 25, restMinutes: 5 }));
            setHours(0); setMinutes(25); setSeconds(0);
        } else if (theme === 'deep_work') {
            setMode('normal');
            setHours(1); setMinutes(30); setSeconds(0);
        } else if (theme === 'break') {
            setMode('normal');
            setHours(0); setMinutes(5); setSeconds(0);
        }
    };

    const handleEditTimeSubmit = () => {
        setIsEditingTime(false);
        const mins = parseInt(editMinutes);
        if (!isNaN(mins) && mins > 0) {
            setCurrentTheme('custom');
            setMode('normal');
            setHours(Math.floor(mins / 60));
            setMinutes(mins % 60);
            setSeconds(0);
        }
    };

    // Calculate progress for circular indicator
    const progress = initialTime > 0 ? (totalSeconds / initialTime) * 100 : 0;
    const radius = 140; // Larger ring
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const formatTime = (totalSecs: number) => {
        const isNegative = totalSecs < 0;
        const absSecs = Math.abs(totalSecs);
        const m = Math.floor(absSecs / 60);
        const s = absSecs % 60;
        return { m, s, isNegative };
    };

    const displayTime = formatTime(totalSeconds);
    const activeTask = profile.todos.find(t => t.id === selectedTaskId);

    // Theme color classes
    const getThemeColorClass = () => {
        if (currentTheme === 'pomodoro') return 'text-orange-500';
        if (currentTheme === 'deep_work') return 'text-blue-500';
        if (currentTheme === 'break') return 'text-emerald-500';
        return 'text-primary';
    };

    const getThemeBgClass = () => {
        if (currentTheme === 'pomodoro') return 'bg-orange-500';
        if (currentTheme === 'deep_work') return 'bg-blue-500';
        if (currentTheme === 'break') return 'bg-emerald-500';
        return 'bg-primary';
    };

    const getThemeBorderClass = () => {
        if (currentTheme === 'pomodoro') return 'border-orange-500';
        if (currentTheme === 'deep_work') return 'border-blue-500';
        if (currentTheme === 'break') return 'border-emerald-500';
        return 'border-primary';
    };

    if (sessionCompleted) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] w-full animate-in fade-in zoom-in duration-500">
                <div className="w-32 h-32 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-bounce">
                    <Check className="w-16 h-16 text-green-500" />
                </div>
                <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Session Complete!</h1>
                <p className="text-xl text-muted-foreground font-medium">+50 XP Gained</p>
                <div className="mt-8">
                    <Button size="lg" onClick={() => setSessionCompleted(false)} className="rounded-full px-8">Continue</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "flex flex-col w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] overflow-y-auto pb-24 md:pb-6 transition-colors duration-700 rounded-3xl relative",
            isActive ? "bg-background/95 backdrop-blur-xl" : "bg-transparent"
        )}>
            {/* Background Tint for Active Mode */}
            {isActive && (
                <div className={cn(
                    "absolute inset-0 opacity-5 pointer-events-none transition-colors duration-1000",
                    getThemeBgClass()
                )} />
            )}

            {/* Top Nav (Inline Stats) */}
            <div className={cn(
                "flex items-center justify-between p-6 transition-opacity duration-500 z-10",
                isActive ? "opacity-0 pointer-events-none h-0 p-0 overflow-hidden" : "opacity-100"
            )}>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Focus Timer</h1>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 bg-card/50 px-3 py-1.5 rounded-full border border-border/50">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-bold">{profile.stats.streak || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-card/50 px-3 py-1.5 rounded-full border border-border/50">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">{profile.todos.filter(t => t.completed && new Date(t.completedAt!).toDateString() === new Date().toDateString()).length} Today</span>
                    </div>
                </div>
            </div>

            {/* Main Center Timer */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <AnimatePresence>
                    {isActive && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 flex flex-col items-center justify-center gap-3 z-20"
                        >
                            {activeTask && (
                                <div className="px-4 py-1.5 bg-card/80 border border-border/50 shadow-sm rounded-full text-sm font-semibold text-foreground flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]", getThemeBgClass(), !isPaused && "animate-pulse")} />
                                    <span className="truncate max-w-[250px]">{activeTask.text}</span>
                                </div>
                            )}
                            <div className="text-muted-foreground font-bold text-xs tracking-[0.2em] uppercase">
                                {currentTheme.replace('_', ' ')} • {mode === 'interval' ? (isWorkPhase ? intervalSettings.workMinutes : intervalSettings.restMinutes) : Math.floor(initialTime / 60)} min
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] flex items-center justify-center group">
                    {/* Circular Progress SVG */}
                    <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 320 320">
                        {/* Background Circle */}
                        <circle
                            cx="160" cy="160" r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-secondary/50"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="160" cy="160" r={radius}
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeLinecap="round"
                            className={cn(
                                "transition-[stroke-dashoffset] duration-1000 ease-linear drop-shadow-[0_0_15px_rgba(currentColor,0.5)]",
                                getThemeColorClass(),
                                isPaused && isActive ? "opacity-30" : "opacity-100"
                            )}
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: strokeDashoffset,
                            }}
                        />
                    </svg>

                    {/* Inner Time Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {!isActive && mode === 'interval' && (
                            <div className={cn("mb-2 text-xs font-bold uppercase tracking-widest bg-secondary/80 px-3 py-1 rounded-full", getThemeColorClass())}>
                                Round {currentRound} / {intervalSettings.rounds}
                            </div>
                        )}
                        {isActive && mode === 'interval' && (
                            <div className={cn("mb-2 text-xs font-bold uppercase tracking-widest bg-secondary/80 px-3 py-1 rounded-full", getThemeColorClass())}>
                                {isWorkPhase ? 'Focusing' : 'Resting'}
                            </div>
                        )}

                        {isEditingTime && !isActive ? (
                            <div className="flex items-center bg-background rounded-2xl shadow-inner px-4 py-2 border border-border">
                                <input
                                    ref={inputRef}
                                    type="number"
                                    min="1"
                                    max="999"
                                    value={editMinutes}
                                    onChange={(e) => setEditMinutes(e.target.value)}
                                    onBlur={handleEditTimeSubmit}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEditTimeSubmit()}
                                    className="w-32 bg-transparent text-center font-mono text-6xl font-black text-foreground focus:outline-none placeholder:text-muted"
                                    placeholder="25"
                                    autoFocus
                                />
                                <span className="text-xl font-bold text-muted-foreground ml-2 mt-4">min</span>
                            </div>
                        ) : (
                            <div 
                                className={cn(
                                    "font-mono tabular-nums tracking-tighter leading-none transition-all drop-shadow-md select-none",
                                    "text-7xl sm:text-[100px] font-black text-foreground",
                                    !isActive && "cursor-pointer hover:scale-105 transition-transform"
                                )}
                                onClick={() => {
                                    if (!isActive) {
                                        setEditMinutes((hours * 60 + minutes).toString());
                                        setIsEditingTime(true);
                                    }
                                }}
                            >
                                {displayTime.m.toString().padStart(2, '0')}:{displayTime.s.toString().padStart(2, '0')}
                            </div>
                        )}

                        {isPaused && isActive && (
                            <div className="absolute bottom-[20%] text-xs font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-4 py-1 rounded-full animate-pulse shadow-sm">
                                PAUSED
                            </div>
                        )}

                        {!isActive && !isEditingTime && (
                            <div className="mt-4 text-sm font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                Tap time to edit
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Setup Controls (Hidden when active) */}
            <div className={cn(
                "flex flex-col items-center gap-6 pb-6 px-6 transition-all duration-500 transform z-10",
                isActive ? "translate-y-20 opacity-0 pointer-events-none h-0 overflow-hidden" : "translate-y-0 opacity-100"
            )}>
                {/* Mode Selector Chips */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                    <PresetChip 
                        label="Pomodoro" 
                        timeLabel="25m + 5m" 
                        active={currentTheme === 'pomodoro'} 
                        themeColor="orange"
                        onClick={() => applyPreset('pomodoro')} 
                    />
                    <PresetChip 
                        label="Deep Work" 
                        timeLabel="90m" 
                        active={currentTheme === 'deep_work'} 
                        themeColor="blue"
                        onClick={() => applyPreset('deep_work')} 
                    />
                    <PresetChip 
                        label="Break" 
                        timeLabel="5m" 
                        active={currentTheme === 'break'} 
                        themeColor="emerald"
                        onClick={() => applyPreset('break')} 
                    />
                </div>

                {/* Minimal Secondary Controls */}
                <div className="flex items-center gap-4 bg-secondary/30 p-2 rounded-2xl border border-border/50">
                    <Button 
                        variant="ghost" size="icon" 
                        className={cn("rounded-xl", soundEnabled ? "text-primary" : "text-muted-foreground")}
                        onClick={() => setSoundEnabled(!soundEnabled)}
                    >
                        {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>
                    <div className="w-px h-6 bg-border/50" />
                    
                    <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                        <SelectTrigger className="w-[200px] border-none bg-transparent shadow-none focus:ring-0 px-2 h-10 font-medium">
                            <SelectValue placeholder="Link a task..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50">
                            <SelectItem value="none"><span className="text-muted-foreground">No Task Linked</span></SelectItem>
                            {profile.todos.filter(t => !t.completed).map(t => (
                                <SelectItem key={t.id} value={t.id}><span className="truncate">{t.text}</span></SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="w-px h-6 bg-border/50" />
                    <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="px-6 pb-12 sm:pb-6 mt-auto w-full max-w-md mx-auto relative z-20">
                {!isActive ? (
                    <Button 
                        className={cn(
                            "w-full h-16 rounded-2xl text-xl font-black text-white shadow-xl hover:scale-[1.02] transition-all",
                            getThemeBgClass(),
                            `shadow-${getThemeColorClass().split('-')[1]}-500/30`
                        )}
                        onClick={handleStart}
                    >
                        START FOCUS
                    </Button>
                ) : (
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                        <Button 
                            className={cn(
                                "h-16 rounded-2xl text-xl font-black text-white shadow-xl hover:scale-[1.02] transition-all",
                                isPaused ? getThemeBgClass() : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                            )}
                            onClick={handlePauseResume}
                        >
                            {isPaused ? <Play className="w-6 h-6 mr-2 fill-current" /> : <Pause className="w-6 h-6 mr-2 fill-current" />}
                            {isPaused ? "RESUME" : "PAUSE"}
                        </Button>
                        <Button 
                            variant="destructive" 
                            className="h-16 w-16 rounded-2xl"
                            onClick={handleReset}
                        >
                            <Square className="w-6 h-6 fill-current" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
