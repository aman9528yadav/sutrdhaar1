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
    const [isFullscreen, setIsFullscreen] = useState(false);
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

    // Fullscreen Overlay Support
    if (isFullscreen) {
        // Calculate true hours, minutes, seconds for digital display
        const absSecs = Math.abs(totalSeconds);
        const h = Math.floor(absSecs / 3600);
        const m = Math.floor((absSecs % 3600) / 60);
        const s = absSecs % 60;
        
        const timeString = h > 0 
            ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-colors duration-500">
                <Button variant="ghost" size="icon" className="absolute top-6 right-6 text-white/50 hover:text-white" onClick={() => setIsFullscreen(false)}>
                    <Minimize2 className="h-8 w-8" />
                </Button>
                
                <div className="font-mono tabular-nums tracking-tighter font-black leading-none drop-shadow-xl select-none text-[25vw] sm:text-[22vw] text-white w-full text-center px-4">
                    {timeString}
                </div>
                
                {isPaused && isActive && (
                    <div className="absolute top-1/4 text-sm font-black uppercase tracking-widest text-white/50 animate-pulse">
                        PAUSED
                    </div>
                )}

                <div className="absolute bottom-12 flex gap-8">
                    {!isActive ? (
                        <Button 
                            size="icon"
                            className="h-16 w-16 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                            onClick={handleStart}
                        >
                            <Play className="h-8 w-8 fill-current ml-1" />
                        </Button>
                    ) : (
                        <>
                            <Button 
                                size="icon"
                                className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/20"
                                onClick={handleReset}
                            >
                                <Square className="w-6 h-6 fill-current" />
                            </Button>
                            <Button 
                                size="icon"
                                className="h-16 w-16 rounded-full bg-white text-black hover:bg-white/90"
                                onClick={handlePauseResume}
                            >
                                {isPaused ? <Play className="h-8 w-8 fill-current ml-1" /> : <Pause className="h-8 w-8 fill-current" />}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "flex flex-col w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] overflow-hidden transition-colors duration-700 rounded-3xl relative",
            isActive ? getThemeBgClass() : "bg-background"
        )}>
            {/* Top Stats / Fullscreen Toggle */}
            <div className={cn(
                "flex items-center justify-between p-4 px-6 transition-all duration-500 z-10 shrink-0",
                isActive ? "opacity-0 -translate-y-full pointer-events-none absolute" : "opacity-100"
            )}>
                <div className="flex gap-3">
                    <div className="flex items-center gap-1.5 bg-card/50 backdrop-blur-xl px-3 py-1 rounded-full border border-border/50">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold">{profile.stats.streak || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-card/50 backdrop-blur-xl px-3 py-1 rounded-full border border-border/50">
                        <Target className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold">{profile.todos.filter(t => t.completed && new Date(t.completedAt!).toDateString() === new Date().toDateString()).length}</span>
                    </div>
                </div>
            </div>

            {/* Always Visible Fullscreen Toggle */}
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                    "absolute top-4 right-6 z-50 rounded-full transition-colors",
                    isActive ? "text-white/50 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:bg-muted"
                )} 
                onClick={() => setIsFullscreen(true)}
            >
                <Maximize2 className="h-5 w-5" />
            </Button>

            {/* Main Center Timer */}
            <div className={cn("flex-1 flex flex-col items-center justify-center relative z-10 transition-all duration-700", isActive ? "mt-0" : "mt-4")}>
                
                <AnimatePresence>
                    {isActive && activeTask && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-10 px-5 py-2 bg-white/20 backdrop-blur-xl shadow-sm rounded-full text-sm font-semibold text-white flex items-center gap-2 z-20"
                        >
                            <div className={cn("w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_white]", !isPaused && "animate-pulse")} />
                            <span className="truncate max-w-[200px]">{activeTask.text}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative w-[85vw] h-[85vw] max-w-[350px] max-h-[350px] flex items-center justify-center group shrink-0">
                    {/* Circular Progress SVG */}
                    <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 320 320">
                        {/* Background Circle */}
                        <circle
                            cx="160" cy="160" r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className={isActive ? "text-white/20" : "text-muted/30"}
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="160" cy="160" r={radius}
                            stroke="currentColor"
                            strokeWidth="14"
                            fill="transparent"
                            strokeLinecap="round"
                            className={cn(
                                "transition-[stroke-dashoffset] duration-1000 ease-linear",
                                isActive ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" : getThemeColorClass(),
                                isPaused && isActive ? "opacity-40" : "opacity-100"
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
                            <div className={cn("mb-3 text-[10px] font-bold uppercase tracking-widest bg-card/80 px-3 py-1 rounded-full border border-border/50", getThemeColorClass())}>
                                Round {currentRound} / {intervalSettings.rounds}
                            </div>
                        )}
                        {isActive && mode === 'interval' && (
                            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-md">
                                {isWorkPhase ? 'Focusing' : 'Resting'}
                            </div>
                        )}

                        {isEditingTime && !isActive ? (
                            <div className="flex items-center bg-card rounded-3xl shadow-inner px-4 py-2 border border-border/50">
                                <input
                                    ref={inputRef}
                                    type="number"
                                    min="1"
                                    max="999"
                                    value={editMinutes}
                                    onChange={(e) => setEditMinutes(e.target.value)}
                                    onBlur={handleEditTimeSubmit}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEditTimeSubmit()}
                                    className="w-28 bg-transparent text-center font-mono text-6xl font-black text-foreground focus:outline-none placeholder:text-muted"
                                    placeholder="25"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div 
                                className={cn(
                                    "font-mono tabular-nums tracking-tighter leading-none transition-all drop-shadow-sm select-none",
                                    "text-7xl sm:text-[90px] font-black",
                                    isActive ? "text-white" : "text-foreground",
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
                            <div className="absolute bottom-[20%] text-[10px] font-black uppercase tracking-widest text-white bg-white/20 px-3 py-1 rounded-full animate-pulse backdrop-blur-md">
                                PAUSED
                            </div>
                        )}

                        {!isActive && !isEditingTime && (
                            <div className="mt-6 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                Tap time to edit
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Controls Area */}
            <div className="w-full max-w-sm mx-auto px-6 pb-6 pt-4 shrink-0 relative z-20">
                {/* Immersive Controls (Only show when Inactive) */}
                <div className={cn(
                    "flex flex-col gap-5 transition-all duration-500",
                    isActive ? "opacity-0 h-0 overflow-hidden translate-y-10" : "opacity-100"
                )}>
                    {/* Segmented Presets */}
                    <div className="flex p-1 bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl">
                        {[
                            { id: 'pomodoro', label: 'Pomodoro' },
                            { id: 'deep_work', label: 'Deep Work' },
                            { id: 'break', label: 'Break' },
                        ].map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => applyPreset(preset.id as TimerTheme)}
                                className={cn(
                                    "flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                                    currentTheme === preset.id
                                        ? cn("text-white shadow-sm", getThemeBgClass())
                                        : "text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Quick Tools */}
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className={cn("rounded-2xl shrink-0 h-12 w-12 border-border/50 bg-card/50 backdrop-blur-xl", soundEnabled ? "text-primary" : "text-muted-foreground")}
                            onClick={() => setSoundEnabled(!soundEnabled)}
                        >
                            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        </Button>
                        
                        <div className="flex-1">
                            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                                <SelectTrigger className="w-full border-border/50 bg-card/50 backdrop-blur-xl shadow-none h-12 rounded-2xl font-semibold text-xs px-4">
                                    <SelectValue placeholder="Link to Task..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/50">
                                    <SelectItem value="none"><span className="text-muted-foreground">No Task Linked</span></SelectItem>
                                    {profile.todos.filter(t => !t.completed).map(t => (
                                        <SelectItem key={t.id} value={t.id}><span className="truncate">{t.text}</span></SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button 
                        className={cn(
                            "w-full h-16 rounded-3xl text-lg font-black text-white shadow-2xl hover:scale-[1.02] transition-all",
                            getThemeBgClass(),
                            `shadow-${getThemeColorClass().split('-')[1]}-500/40`
                        )}
                        onClick={handleStart}
                    >
                        START
                    </Button>
                </div>

                {/* Active Controls */}
                <div className={cn(
                    "flex items-center justify-center gap-4 transition-all duration-500",
                    !isActive ? "opacity-0 h-0 overflow-hidden translate-y-10 absolute" : "opacity-100"
                )}>
                    <Button 
                        className={cn(
                            "h-20 w-20 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 border-none",
                            isPaused ? "bg-white text-black" : "bg-white/20 text-white backdrop-blur-md"
                        )}
                        onClick={handlePauseResume}
                    >
                        {isPaused ? <Play className="w-8 h-8 ml-1 fill-current" /> : <Pause className="w-8 h-8 fill-current" />}
                    </Button>
                    {isPaused && (
                        <Button 
                            variant="outline" 
                            className="h-16 w-16 rounded-full border-2 border-white/30 text-white hover:bg-white/20 backdrop-blur-md transition-all hover:scale-105"
                            onClick={handleReset}
                        >
                            <Square className="w-6 h-6 fill-current" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
