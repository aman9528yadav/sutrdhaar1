"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Clock, AlertTriangle, ShieldCheck, Hammer, Activity, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export function MaintenanceOverlay({ endTime, isOwner = false, message, type, onBypass }: { endTime: number | null, isOwner?: boolean, message?: string | null, type?: 'update' | 'bugfix' | 'checkup' | null, onBypass?: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleIconClick = () => {
    setClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        onBypass?.();
        return 0;
      }
      return next;
    });
  };

  useEffect(() => {
    if (clickCount === 0) return;
    const timer = setTimeout(() => {
      setClickCount(0);
    }, 2000);
    return () => clearTimeout(timer);
  }, [clickCount]);

  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = endTime - now;

      if (difference <= 0) {
        setIsTimerFinished(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        setIsTimerFinished(false);
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    // Check immediately on mount
    if (endTime - Date.now() <= 0) {
      setIsTimerFinished(true);
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }

    return () => clearInterval(interval);
  }, [endTime]);

  useEffect(() => {
    // Intercept keyboard shortcuts for refresh (F5, Ctrl+R, Cmd+R)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F5' || 
        (e.ctrlKey && (e.key === 'r' || e.key === 'R')) || 
        (e.metaKey && (e.key === 'r' || e.key === 'R'))
      ) {
        e.preventDefault();
      }
    };

    // Show warning dialog if they try to close/refresh via browser buttons
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; 
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleDisableMaintenance = async () => {
    const { error } = await supabase
      .from('maintenance')
      .upsert({ id: true, is_active: false, end_time: null });
    
    if (error) {
      alert("Failed to disable maintenance: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background text-foreground overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 max-w-md w-full px-6 text-center space-y-8"
      >
        <div className="w-24 h-24 mx-auto relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75" />
          <div 
            onClick={handleIconClick}
            className="relative w-full h-full bg-card border border-white/10 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xl cursor-default select-none"
          >
            {type === 'update' && <ArrowUpCircle className="w-10 h-10 text-primary animate-pulse" />}
            {type === 'bugfix' && <Hammer className="w-10 h-10 text-primary animate-bounce" />}
            {type === 'checkup' && <Activity className="w-10 h-10 text-primary animate-pulse" />}
            {(!type || type === null) && <Settings className="w-10 h-10 text-primary animate-[spin_4s_linear_infinite]" />}
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight">
            {type === 'update' ? 'System Update in Progress' : 
             type === 'bugfix' ? 'Squashing some bugs!' : 
             type === 'checkup' ? 'Routine Checkup' : 
             "We'll be back soon!"}
          </h1>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {message || "Our platform is currently undergoing scheduled maintenance to bring you new features and improvements. We apologize for any inconvenience."}
          </p>
        </div>

        {endTime && isTimerFinished ? (
          <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-3xl shadow-xl flex flex-col items-center gap-3">
            <h2 className="text-xl font-bold text-green-500 tracking-tight">🎉 Congratulations!</h2>
            <p className="text-sm text-green-400/90 font-medium leading-relaxed max-w-xs">
              We are almost ready! The platform will be fully back online in just a few minutes.
            </p>
          </div>
        ) : endTime && timeLeft ? (
          <div className="p-6 bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
              <Clock className="w-4 h-4" />
              <span>Estimated Time Remaining</span>
            </div>
            
            <div className="flex items-center gap-4">
              {timeLeft.days > 0 && (
                <>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-black font-mono bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
                      {timeLeft.days}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Days</span>
                  </div>
                  <span className="text-3xl font-black text-muted-foreground/30 -mt-5">:</span>
                </>
              )}
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black font-mono bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
                  {timeLeft.hours.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Hours</span>
              </div>
              <span className="text-3xl font-black text-muted-foreground/30 -mt-5">:</span>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black font-mono bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
                  {timeLeft.minutes.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Mins</span>
              </div>
              <span className="text-3xl font-black text-muted-foreground/30 -mt-5">:</span>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black font-mono bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Secs</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-center justify-center gap-3 mt-8">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-white/5 py-3 px-4 rounded-full max-w-xs mx-auto backdrop-blur-md border border-white/5">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>Please do not refresh the page.</span>
          </div>
          
          {isOwner && (
            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl w-full flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
                <ShieldCheck className="w-5 h-5" />
                <span>Owner Controls</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                You are seeing this screen because you are the owner. Other users are currently locked out.
              </p>
              <Button onClick={handleDisableMaintenance} variant="destructive" className="w-full font-bold shadow-lg shadow-red-500/20">
                Disable Maintenance Mode
              </Button>
            </div>
          )}
        </div>
      </motion.div>
      
      <div className="absolute bottom-8 left-0 right-0 text-center text-xs text-muted-foreground/50 font-medium tracking-wide">
        Made by Aman Yadav
      </div>
    </div>
  );
}
