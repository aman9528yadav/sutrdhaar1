"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw, Flag, Download, Copy, Maximize, Minimize2, Trophy, Clock, Settings, Zap, Target, Flame, Star, Heart, Music, Sun, Moon, Database, Share2, Timer, Activity, MapPin, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

// Utility for formatting time
const formatTime = (time: number) => {
  const milliseconds = Math.floor((time % 1000) / 10);
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const hours = Math.floor((time / (1000 * 60 * 60)) % 24);

  return {
    h: hours.toString().padStart(2, '0'),
    m: minutes.toString().padStart(2, '0'),
    s: seconds.toString().padStart(2, '0'),
    ms: milliseconds.toString().padStart(2, '0')
  };
};

export function StopwatchModern() {
  const { toast } = useToast();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [splitTimes, setSplitTimes] = useState<number[]>([]);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [worstTime, setWorstTime] = useState<number | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [paceMode, setPaceMode] = useState<'time' | 'distance'>('time');
  const [currentPace, setCurrentPace] = useState<number>(0);
  const [activityType, setActivityType] = useState<'running' | 'cycling' | 'swimming' | 'other'>('running');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLapTimeRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          toggleTimer();
          break;
        case 'r':
          if (!isRunning) resetTimer();
          break;
        case 'l':
          if (isRunning) recordLap();
          break;
        case 'escape':
          setIsFullScreen(false);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, time]);

  // Timer Interval Logic
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTimeRef.current;
        setTime(accumulatedTimeRef.current + elapsed);
      }, 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      accumulatedTimeRef.current = time;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    setSplitTimes([]);
    setBestTime(null);
    setWorstTime(null);
    accumulatedTimeRef.current = 0;
    lastLapTimeRef.current = 0;
    setCurrentPace(0);
  };

  const recordLap = () => {
    const lapTime = time - lastLapTimeRef.current;
    setLaps(prev => [lapTime, ...prev]);
    setSplitTimes(prev => [...prev, time]);
    lastLapTimeRef.current = time;
    
    // Update best/worst times
    if (laps.length === 0) {
      setBestTime(lapTime);
      setWorstTime(lapTime);
    } else {
      setBestTime(prev => prev === null ? lapTime : Math.min(prev, lapTime));
      setWorstTime(prev => prev === null ? lapTime : Math.max(prev, lapTime));
    }
    
    // Calculate pace
    if (totalDistance > 0) {
      const distancePerLap = totalDistance / (laps.length + 1);
      const paceInSeconds = lapTime / 1000 / distancePerLap;
      setCurrentPace(paceInSeconds);
    }
    
    toast({
      title: "Lap Recorded",
      description: `Lap time: ${formatTime(lapTime).m}:${formatTime(lapTime).s}.${formatTime(lapTime).ms}`
    });
  };

  const copyLaps = () => {
    const text = laps.map((lap, i) => {
      const { m, s, ms } = formatTime(lap);
      return `Lap ${laps.length - i}: ${m}:${s}.${ms}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Laps copied to clipboard" });
  };

  const shareResults = async () => {
    const text = `⏱️ Stopwatch Results\nTotal Time: ${formatTime(time).h}:${formatTime(time).m}:${formatTime(time).s}.${formatTime(time).ms}\nLaps: ${laps.length}\nBest Lap: ${bestTime ? `${formatTime(bestTime).m}:${formatTime(bestTime).s}.${formatTime(bestTime).ms}` : 'N/A'}\nWorst Lap: ${worstTime ? `${formatTime(worstTime).m}:${formatTime(worstTime).s}.${formatTime(worstTime).ms}` : 'N/A'}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Stopwatch Results',
          text: text
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Results Copied!", description: "Results copied to clipboard" });
    }
  };

  const { h, m, s, ms } = formatTime(time);

  // Full Screen View
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-12 w-12 rounded-full"
          onClick={() => setIsFullScreen(false)}
        >
          <Minimize2 className="h-6 w-6" />
        </Button>

        <div className="font-mono text-[15vw] font-bold tabular-nums tracking-tighter leading-none flex items-baseline">
          {parseInt(h) > 0 && <span>{h}:</span>}
          <span>{m}:{s}</span>
          <span className="text-[0.4em] text-muted-foreground ml-4">.{ms}</span>
        </div>

        <div className="mt-12 flex gap-8">
          <Button
            variant="outline"
            size="lg"
            className="h-24 w-24 rounded-full border-2 text-xl"
            onClick={isRunning ? recordLap : resetTimer}
          >
            {isRunning ? 'Lap' : 'Reset'}
          </Button>
          <Button
            size="lg"
            className={cn(
              "h-24 w-24 rounded-full text-xl shadow-lg transition-all",
              isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            )}
            onClick={toggleTimer}
          >
            {isRunning ? 'Stop' : 'Start'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                  Stopwatch
              </h1>
              <p className="text-muted-foreground mt-1">Track laps and performance</p>
          </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <CardContent className="p-3 text-center">
            <Trophy className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Laps</p>
            <p className="text-lg font-bold text-blue-500">{laps.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-3 text-center">
            <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Best</p>
            <p className="text-lg font-bold text-green-500">
              {bestTime ? `${formatTime(bestTime).m}:${formatTime(bestTime).s}` : '--:--'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/20">
          <CardContent className="p-3 text-center">
            <Flame className="w-5 h-5 text-rose-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Worst</p>
            <p className="text-lg font-bold text-rose-500">
              {worstTime ? `${formatTime(worstTime).m}:${formatTime(worstTime).s}` : '--:--'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-3 text-center">
            <Activity className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Avg</p>
            <p className="text-lg font-bold text-purple-500">
              {laps.length > 0 ? `${formatTime(laps.reduce((a, b) => a + b, 0) / laps.length).m}:${formatTime(laps.reduce((a, b) => a + b, 0) / laps.length).s}` : '--:--'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl bg-gradient-to-br from-card to-card/50 backdrop-blur-xl ring-1 ring-white/10 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full translate-y-12 -translate-x-12"></div>
        
        <CardContent className="p-8 relative">
          {/* Enhanced Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Stopwatch</h2>
                <p className="text-sm text-muted-foreground">Track your performance</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSettings(!showSettings)}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={() => setIsFullScreen(true)}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-muted/30 rounded-xl border border-border/50"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Activity Type
                    </Label>
                    <Select value={activityType} onValueChange={(v) => setActivityType(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="running">🏃 Running</SelectItem>
                        <SelectItem value="cycling">🚴 Cycling</SelectItem>
                        <SelectItem value="swimming">🏊 Swimming</SelectItem>
                        <SelectItem value="other">-other-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Ruler className="h-4 w-4" /> Total Distance (km)
                    </Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={totalDistance || ''}
                      onChange={(e) => setTotalDistance(parseFloat(e.target.value) || 0)}
                      className="text-center"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Main Display */}
          <div className="flex flex-col items-center justify-center mb-12 relative">
            {/* Progress Ring */}
            <div className="absolute w-80 h-80 rounded-full border-4 border-primary/10"></div>
            
            <motion.div
              layout
              className="font-mono text-8xl font-bold tracking-tighter tabular-nums text-foreground flex items-baseline z-10"
            >
              {parseInt(h) > 0 && <span className="mr-2">{h}:</span>}
              <span>{m}:{s}</span>
              <span className="text-4xl text-muted-foreground ml-2 font-normal">.{ms}</span>
            </motion.div>

            {/* Enhanced Current Lap Display */}
            {isRunning && laps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-4 text-lg font-mono text-muted-foreground/80 tabular-nums"
              >
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-primary" />
                  <span>Lap: {formatTime(time - lastLapTimeRef.current).m}:{formatTime(time - lastLapTimeRef.current).s}</span>
                </div>
                {currentPace > 0 && (
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span>Pace: {Math.floor(currentPace/60)}:{(currentPace%60).toFixed(0).padStart(2,'0')}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Activity Indicator */}
            {isRunning && (
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mt-4 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 text-primary font-medium flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Recording...
              </motion.div>
            )}
          </div>

          {/* Enhanced Controls */}
          <div className="flex items-center justify-between gap-6 px-4">
            <Button
              variant="outline"
              size="icon"
              className="h-20 w-20 rounded-2xl border-border/50 hover:bg-secondary hover:border-border transition-all shadow-lg"
              onClick={resetTimer}
              disabled={isRunning && time > 0}
            >
              <RotateCcw className={cn("h-8 w-8", time === 0 && "opacity-50")} />
            </Button>

            <Button
              size="lg"
              className={cn(
                "h-28 w-28 rounded-3xl shadow-2xl text-white transition-all transform hover:scale-105 active:scale-95 border-0",
                isRunning ? "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600" : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              )}
              onClick={toggleTimer}
            >
              {isRunning ? <Pause className="h-12 w-12 fill-current" /> : <Play className="h-12 w-12 fill-current ml-1" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-20 w-20 rounded-2xl border-border/50 hover:bg-secondary hover:border-border transition-all shadow-lg"
              onClick={recordLap}
              disabled={!isRunning}
            >
              <Flag className={cn("h-8 w-8", !isRunning && "opacity-50")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Laps List */}
      <AnimatePresence>
        {laps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Lap Times</h3>
                      <p className="text-sm text-muted-foreground">{laps.length} laps recorded</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={shareResults} className="h-8">
                      <Share2 className="h-3 w-3 mr-1" /> Share
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyLaps} className="h-8">
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="divide-y divide-border/30">
                    {laps.map((lap, i) => {
                      const { m, s, ms } = formatTime(lap);
                      const index = laps.length - i;
                      const isFastest = Math.min(...laps) === lap;
                      const isSlowest = Math.max(...laps) === lap && laps.length > 1;
                      const splitTime = splitTimes[laps.length - 1 - i];

                      return (
                        <div key={index} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors group">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground font-mono w-8">#{index}</span>
                            {isFastest && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                            {isSlowest && <Flame className="h-4 w-4 text-red-500" />}
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <span className={cn(
                              "font-mono text-lg font-medium tabular-nums",
                              isFastest && "text-emerald-500",
                              isSlowest && "text-rose-500",
                              !isFastest && !isSlowest && "text-foreground"
                            )}>
                              {m}:{s}.{ms}
                            </span>
                            
                            {splitTime && (
                              <span className="text-sm text-muted-foreground font-mono">
                                Split: {formatTime(splitTime).m}:{formatTime(splitTime).s}
                              </span>
                            )}
                          </div>
                          
                          <span className="text-xs text-muted-foreground/50 w-16 text-right">
                            {isFastest && "Best"}
                            {isSlowest && "Worst"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}