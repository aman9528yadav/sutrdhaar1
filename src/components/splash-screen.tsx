"use client";

import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-primary/30 mb-8">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                <Sparkles className="h-12 w-12 text-white" />
            </motion.div>
        </div>
        
        <motion.h1
            className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
            Sutradhaar
        </motion.h1>

        <motion.p
            className="text-muted-foreground font-medium mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            Smart Tools & Calculators
        </motion.p>
      </motion.div>

      <motion.div 
        className="absolute bottom-16 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground tracking-widest uppercase">Loading workspace...</p>
      </motion.div>
    </div>
  );
}
