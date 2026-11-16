"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Lock, CheckCircle2, ChevronRight, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/context/ProfileContext';
import { getProgressToNextLevel, LEVEL_REQUIREMENTS, FeatureId, XP_PER_LEVEL } from '@/lib/level-system';
import { Progress } from '@/components/ui/progress';

const FEATURE_DESCRIPTIONS: Record<FeatureId, { title: string, icon: React.ReactNode }> = {
  calculator: { title: 'Calculator', icon: <Star className="w-5 h-5 text-blue-500" /> },
  notes: { title: 'Notes & To-Do', icon: <Star className="w-5 h-5 text-yellow-500" /> },
  settings: { title: 'App Settings', icon: <Star className="w-5 h-5 text-gray-500" /> },
  converter: { title: 'Basic Unit Converter', icon: <Star className="w-5 h-5 text-purple-500" /> },
  advanced_converter: { title: 'Advanced Converter Categories', icon: <Star className="w-5 h-5 text-purple-500" /> },
  themes: { title: 'Custom App Themes', icon: <Star className="w-5 h-5 text-pink-500" /> },
  date_calc: { title: 'Date Calculator', icon: <Star className="w-5 h-5 text-orange-500" /> },
  timer: { title: 'Timer & Stopwatch', icon: <Star className="w-5 h-5 text-red-500" /> },
  analytics: { title: 'Analytics Dashboard', icon: <Star className="w-5 h-5 text-emerald-500" /> },
  password_gen: { title: 'Password Generator', icon: <Star className="w-5 h-5 text-indigo-500" /> },
  budget: { title: 'Budget Tracker', icon: <Star className="w-5 h-5 text-green-500" /> },
  translator: { title: 'Translator', icon: <Star className="w-5 h-5 text-blue-400" /> },
  loan_calc: { title: 'Loan Calculator', icon: <Star className="w-5 h-5 text-teal-500" /> },
  backup: { title: 'Data Backup (Import/Export)', icon: <Star className="w-5 h-5 text-cyan-500" /> },
  discount_calc: { title: 'Discount Calculator', icon: <Star className="w-5 h-5 text-rose-500" /> },
  save_history: { title: 'Save App History', icon: <Star className="w-5 h-5 text-orange-500" /> },
  export_pdf: { title: 'Export Notes & To-Do to PDF', icon: <Star className="w-5 h-5 text-red-500" /> },
};

export function ProgressionPage() {
  const { profile } = useProfile();
  const isAdmin = profile.email === 'amanyadavyadav9458@gmail.com';
  
  const xp = profile.stats?.xp || 0;
  const level = profile.stats?.level || 1;
  const { currentLevelXP, nextLevelXP, percentage } = getProgressToNextLevel(xp);

  // Group features by level
  const levelsData: Record<number, FeatureId[]> = {};
  (Object.keys(LEVEL_REQUIREMENTS) as FeatureId[]).forEach(feature => {
    const reqLevel = LEVEL_REQUIREMENTS[feature];
    if (!levelsData[reqLevel]) levelsData[reqLevel] = [];
    levelsData[reqLevel].push(feature);
  });

  const allLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-20">
      
      {isAdmin && (
        <div className="bg-amber-500 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <Crown className="w-8 h-8" />
          <div>
            <h3 className="font-bold text-lg">Admin Status Active</h3>
            <p className="text-sm text-white/90">You have automatically bypassed all level restrictions.</p>
          </div>
        </div>
      )}

      {/* Header Profile Section */}
      <Card className="bg-card border-border/50 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Trophy className="w-32 h-32 text-primary" />
        </div>
        <CardContent className="p-6 relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-4xl font-black text-white">{level}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Level {level}</h2>
            <p className="text-muted-foreground font-medium">{xp} Total XP</p>
          </div>

          <div className="w-full max-w-md pt-4 space-y-2">
            <div className="flex justify-between text-sm font-semibold text-muted-foreground">
              <span>{currentLevelXP} XP</span>
              <span>{nextLevelXP} XP</span>
            </div>
            <Progress value={percentage} className="h-4 rounded-full" />
            <p className="text-xs text-muted-foreground pt-1">
              Earn XP by using tools like the Calculator, Converter, and Notes!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progression Path */}
      <div className="pt-4">
        <h3 className="text-xl font-bold mb-6 px-2">Unlock Path</h3>
        
        <div className="space-y-4">
          {allLevels.map((lvl) => {
            const isUnlocked = level >= lvl || isAdmin;
            const features = levelsData[lvl] || [];
            
            return (
              <motion.div 
                key={lvl}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative pl-8 pb-4 border-l-2 ${isUnlocked ? 'border-primary' : 'border-border/50'} ml-4`}
              >
                {/* Node marker */}
                <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center ${isUnlocked ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {isUnlocked ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>

                <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm -mt-2">
                  <h4 className={`font-bold flex items-center gap-2 ${isUnlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                    Level {lvl}
                    {isUnlocked && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Unlocked</span>}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">Requires {lvl * XP_PER_LEVEL - XP_PER_LEVEL} XP</p>
                  
                  <div className="space-y-2">
                    {features.map(f => (
                      <div key={f} className={`flex items-center gap-3 p-2 rounded-lg ${isUnlocked ? 'bg-muted/50' : 'opacity-60'}`}>
                        {FEATURE_DESCRIPTIONS[f].icon}
                        <span className="font-medium text-sm">{FEATURE_DESCRIPTIONS[f].title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
