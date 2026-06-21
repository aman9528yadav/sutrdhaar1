"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Home, LayoutGrid, User, Settings, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeTourProps {
  onTabSelect: (tab: string) => void;
}

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Sutradhaar!',
    description: 'Your ultimate productivity and financial companion. Let\'s take a quick 30-second tour to get you started.',
    icon: Sparkles,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    tab: 'dashboard'
  },
  {
    id: 'dashboard',
    title: 'The Dashboard',
    description: 'Your daily command center. Track your habits, view weekly summaries, and manage quick tasks all in one place.',
    icon: Home,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    tab: 'dashboard'
  },
  {
    id: 'tools',
    title: 'Powerful Tools',
    description: 'Access a massive suite of calculators, unit converters, and developer utilities designed to save you time.',
    icon: LayoutGrid,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    tab: 'tools-list'
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Track your usage streaks, earn XP, and level up your productivity game as you use the app.',
    icon: User,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    tab: 'profile'
  },
  {
    id: 'settings',
    title: 'Deep Customization',
    description: 'Make it yours. Change themes, manage your data, and tweak advanced settings to fit your exact workflow.',
    icon: Settings,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    tab: 'settings'
  }
];

export function WelcomeTour({ onTabSelect }: WelcomeTourProps) {
  const { profile, setProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show tour if they haven't seen it and are authenticated
    if (profile.isAuthenticated && !profile.settings.hasSeenWelcomeTour) {
      setIsVisible(true);
      onTabSelect('dashboard'); // Start at dashboard
    }
  }, [profile.isAuthenticated, profile.settings.hasSeenWelcomeTour, onTabSelect]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onTabSelect(TOUR_STEPS[nextStep].tab);
    } else {
      finishTour();
    }
  };

  const finishTour = () => {
    setIsVisible(false);
    onTabSelect('dashboard'); // Return to dashboard at the end
    // Save to profile
    setProfile(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        hasSeenWelcomeTour: true
      }
    }));
  };

  if (!isVisible) return null;

  const stepInfo = TOUR_STEPS[currentStep];
  const Icon = stepInfo.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      {/* Dimmed Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/60 backdrop-blur-[2px]"
      />

      {/* Tour Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            "relative w-[90%] max-w-[400px] rounded-[32px] p-8 overflow-hidden",
            "bg-card/90 backdrop-blur-3xl shadow-2xl border",
            stepInfo.border
          )}
        >
          {/* Glowing background blob */}
          <div className={cn(
            "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30",
            stepInfo.bg
          )} />

          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center",
              stepInfo.bg
            )}>
              <Icon className={cn("w-10 h-10", stepInfo.color)} />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {stepInfo.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {stepInfo.description}
              </p>
            </div>

            <div className="w-full pt-4 flex items-center justify-between gap-4">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      idx === currentStep ? cn("w-6", stepInfo.bg.replace('/10', '')) : "w-1.5 bg-border/50"
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={finishTour}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Skip
                </Button>
                <Button 
                  onClick={handleNext}
                  className={cn(
                    "rounded-xl font-bold shadow-lg gap-2",
                    isLast ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" : "bg-primary text-primary-foreground shadow-primary/20"
                  )}
                >
                  {isLast ? "Get Started" : "Next"}
                  {isLast ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
