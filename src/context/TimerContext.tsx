"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useProfile } from './ProfileContext';
import { useToast } from '@/hooks/use-toast';

interface IntervalSettings {
    workMinutes: number;
    workSeconds: number;
    restMinutes: number;
    restSeconds: number;
    rounds: number;
}

interface TimerContextType {
    mode: 'normal' | 'interval';
    setMode: (mode: 'normal' | 'interval') => void;
    hours: number;
    setHours: (h: number) => void;
    minutes: number;
    setMinutes: (m: number) => void;
    seconds: number;
    setSeconds: (s: number) => void;
    totalSeconds: number;
    setTotalSeconds: (s: number | ((prev: number) => number)) => void;
    initialTime: number;
    setInitialTime: (t: number) => void;
    isActive: boolean;
    setIsActive: (a: boolean) => void;
    isPaused: boolean;
    setIsPaused: (p: boolean) => void;
    intervalSettings: IntervalSettings;
    setIntervalSettings: (s: IntervalSettings | ((prev: IntervalSettings) => IntervalSettings)) => void;
    currentRound: number;
    setCurrentRound: (r: number | ((prev: number) => number)) => void;
    isWorkPhase: boolean;
    setIsWorkPhase: (w: boolean) => void;
    selectedTaskId: string;
    setSelectedTaskId: (id: string) => void;
    handleStart: () => void;
    handlePauseResume: () => void;
    handleReset: () => void;
    setPreset: (mins: number) => void;
    quickAddTime: (secs: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function useTimer() {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
}

export function TimerProvider({ children }: { children: ReactNode }) {
    const { profile, updateTodo } = useProfile();
    const { toast } = useToast();

    const [mode, setMode] = useState<'normal' | 'interval'>('normal');
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [initialTime, setInitialTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [intervalSettings, setIntervalSettings] = useState<IntervalSettings>({
        workMinutes: 0,
        workSeconds: 30,
        restMinutes: 0,
        restSeconds: 15,
        rounds: 8,
    });
    const [currentRound, setCurrentRound] = useState(1);
    const [isWorkPhase, setIsWorkPhase] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState<string>('none');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Persistence Logic
    useEffect(() => {
        const savedState = localStorage.getItem('sutradhaar_timer_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                setMode(parsed.mode);
                setHours(parsed.hours);
                setMinutes(parsed.minutes);
                setSeconds(parsed.seconds);
                setInitialTime(parsed.initialTime);
                setIntervalSettings(parsed.intervalSettings);
                setCurrentRound(parsed.currentRound);
                setIsWorkPhase(parsed.isWorkPhase);
                setSelectedTaskId(parsed.selectedTaskId);

                // Handle active timer recovery
                if (parsed.isActive && !parsed.isPaused) {
                    const elapsedSeconds = Math.floor((Date.now() - parsed.lastUpdated) / 1000);
                    const newTotalSeconds = Math.max(0, parsed.totalSeconds - elapsedSeconds);
                    setTotalSeconds(newTotalSeconds);
                    setIsActive(newTotalSeconds > 0);
                    setIsPaused(false); // Resume automatically? Or pause? Let's resume.
                } else {
                    setTotalSeconds(parsed.totalSeconds);
                    setIsActive(parsed.isActive);
                    setIsPaused(parsed.isPaused);
                }
            } catch (e) {
                console.error("Failed to load timer state", e);
            }
        }
    }, []);

    useEffect(() => {
        const stateToSave = {
            mode,
            hours,
            minutes,
            seconds,
            totalSeconds,
            initialTime,
            isActive,
            isPaused,
            intervalSettings,
            currentRound,
            isWorkPhase,
            selectedTaskId,
            lastUpdated: Date.now()
        };
        localStorage.setItem('sutradhaar_timer_state', JSON.stringify(stateToSave));
    }, [mode, hours, minutes, seconds, totalSeconds, initialTime, isActive, isPaused, intervalSettings, currentRound, isWorkPhase, selectedTaskId]);

    // Play sound helper
    const tryVibrate = (pattern: number | number[]) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(pattern); } catch (e) {}
        }
    };

    const playSound = (loop = false) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.loop = loop;
        audio.play().catch(e => console.log("Audio play failed", e));
        audioRef.current = audio;
    };

    const stopSound = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
    };

    // Main Timer Interval
    useEffect(() => {
        if (isActive && !isPaused) {
            timerRef.current = setInterval(() => {
                setTotalSeconds((prev) => {
                    if (prev <= 6 && prev > 1) { // 5, 4, 3, 2, 1
                        tryVibrate(30);
                    }
                    if (prev <= 1) {
                        tryVibrate([100, 100, 100]);
                        // Timer finished
                        if (mode === 'interval') {
                            // Interval logic handled in effect below
                            return 0;
                        } else {
                            // Normal timer finished - Continue counting down (overtime)
                            if (prev === 1) {
                                toast({
                                    title: 'Timer Finished! ⏰',
                                    description: 'Your countdown has ended.',
                                    duration: 5000,
                                });
                                playSound(true);
                            }
                            return prev - 1;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, isPaused, mode, toast]);

    // Interval Logic Handling
    useEffect(() => {
        if (totalSeconds === 0 && isActive && mode === 'interval') {
            handleIntervalComplete();
        }
    }, [totalSeconds, isActive, mode]);

    // Task Update Interval
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && !isPaused && selectedTaskId !== 'none' && mode === 'normal') {
            interval = setInterval(() => {
                // We need to access the current profile state. 
                // Since this effect depends on profile, it will restart every time profile changes.
                // This is acceptable for now.
                const task = profile.todos.find(t => t.id === selectedTaskId);
                if (task) {
                    updateTodo({
                        ...task,
                        timeSpent: (task.timeSpent || 0) + 1
                    });
                }
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, isPaused, selectedTaskId, mode, profile.todos, updateTodo]);

    const handleIntervalComplete = () => {
        if (isWorkPhase) {
            // Work phase complete, start rest
            setIsWorkPhase(false);
            const restTime = intervalSettings.restMinutes * 60 + intervalSettings.restSeconds;
            setTotalSeconds(restTime);
            setInitialTime(restTime);
            toast({
                title: '💪 Work Complete!',
                description: `Round ${currentRound}/${intervalSettings.rounds} - Rest time!`,
            });
            playSound(false);
            tryVibrate([200, 100, 200]);
        } else {
            // Rest phase complete
            if (currentRound >= intervalSettings.rounds) {
                // All rounds complete
                handleReset();
                toast({
                    title: '🎉 Workout Complete!',
                    description: `Finished all ${intervalSettings.rounds} rounds!`,
                    duration: 5000,
                });
                playSound(false); // Maybe loop here too? Usually workout finish is a single celebration. Let's keep it simple.
                tryVibrate([500, 200, 500]);
            } else {
                // Start next round
                setCurrentRound(prev => prev + 1);
                setIsWorkPhase(true);
                const workTime = intervalSettings.workMinutes * 60 + intervalSettings.workSeconds;
                setTotalSeconds(workTime);
                setInitialTime(workTime);
                toast({
                    title: '🔥 Next Round!',
                    description: `Round ${currentRound + 1}/${intervalSettings.rounds} - Work time!`,
                });
                playSound(false);
                tryVibrate([200, 100, 200]);
            }
        }
    };

    const handleStart = () => {
        stopSound();
        tryVibrate(50);
        if (mode === 'normal') {
            const time = hours * 3600 + minutes * 60 + seconds;
            if (time > 0) {
                setTotalSeconds(time);
                setInitialTime(time);
                setIsActive(true);
                setIsPaused(false);
            }
        } else {
            // Interval mode
            const workTime = intervalSettings.workMinutes * 60 + intervalSettings.workSeconds;
            setTotalSeconds(workTime);
            setInitialTime(workTime);
            setIsActive(true);
            setIsPaused(false);
            setCurrentRound(1);
            setIsWorkPhase(true);
        }
    };

    const handlePauseResume = () => {
        stopSound();
        tryVibrate(50);
        setIsPaused(!isPaused);
    };

    const handleReset = () => {
        stopSound();
        tryVibrate([50, 50]);
        setIsActive(false);
        setIsPaused(true);
        setTotalSeconds(0);
        setCurrentRound(1);
        setIsWorkPhase(true);
    };

    const setPreset = (mins: number) => {
        stopSound();
        setHours(0);
        setMinutes(mins);
        setSeconds(0);
    };

    const quickAddTime = (secondsToAdd: number) => {
        if (isActive) {
            setTotalSeconds(prev => prev + secondsToAdd);
            setInitialTime(prev => prev + secondsToAdd);
            toast({
                title: secondsToAdd > 0 ? 'Time Added! ⏱️' : 'Time Removed! ⏱️',
                description: `${Math.abs(secondsToAdd / 60)} minute${Math.abs(secondsToAdd / 60) !== 1 ? 's' : ''}`,
            });
        }
    };

    return (
        <TimerContext.Provider value={{
            mode, setMode,
            hours, setHours,
            minutes, setMinutes,
            seconds, setSeconds,
            totalSeconds, setTotalSeconds,
            initialTime, setInitialTime,
            isActive, setIsActive,
            isPaused, setIsPaused,
            intervalSettings, setIntervalSettings,
            currentRound, setCurrentRound,
            isWorkPhase, setIsWorkPhase,
            selectedTaskId, setSelectedTaskId,
            handleStart,
            handlePauseResume,
            handleReset,
            setPreset,
            quickAddTime
        }}>
            {children}
        </TimerContext.Provider>
    );
}
