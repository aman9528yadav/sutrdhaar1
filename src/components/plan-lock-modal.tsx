"use client";

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Lock, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  Calculator, 
  ArrowRightLeft, 
  Crown, 
  Settings, 
  CheckCircle2, 
  X,
  Zap,
  ArrowRight
} from 'lucide-react';

export type PlanLockType = 'login' | 'pro' | 'ultra' | null;

interface PlanLockModalProps {
  type: PlanLockType;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAuth: (mode?: 'login' | 'signup') => void;
  onNavigateToMembership: () => void;
}

export function PlanLockModal({
  type,
  isOpen,
  onClose,
  onNavigateToAuth,
  onNavigateToMembership
}: PlanLockModalProps) {
  if (!isOpen || !type) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[340px] sm:max-w-[380px] p-0 overflow-hidden rounded-[2.5rem] border border-border/50 bg-card shadow-2xl [&>button]:hidden">
        
        {/* ============================================================== */}
        {/* 1. LOGIN REQUIRED MODAL                                         */}
        {/* ============================================================== */}
        {type === 'login' && (
          <div className="flex flex-col w-full text-foreground">
            {/* Top Purple Gradient Header */}
            <div className="bg-gradient-to-br from-[#7928CA] via-[#8A2BE2] to-[#A855F7] p-6 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3.5 shadow-inner">
                <Lock className="w-5 h-5 text-white" />
              </div>

              <h2 className="text-xl font-black tracking-tight">Login Required</h2>
              <p className="text-xs text-white/90 mt-1 leading-snug">
                Sign in or create a free account to access this tool.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* New User Offer Banner */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/15 border border-amber-500/25 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    🎉 New User Offer
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Register now & get <span className="font-bold text-foreground">24-hour Ultra plan free</span> — all features unlocked!
                  </p>
                </div>
              </div>

              {/* Free Basic Plan Includes list */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  FREE BASIC PLAN INCLUDES
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-foreground/80">
                  <div className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-orange-500" />
                    <span>Calculator</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                    <span>Unit Converter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Membership</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-purple-500" />
                    <span>Settings Hub</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  👑 Notes, Passwords, Budget & more unlock with Pro & Ultra
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={() => {
                    onClose();
                    onNavigateToAuth('login');
                  }}
                  className="w-full h-11 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Sign In to My Account
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onNavigateToAuth('signup');
                  }}
                  className="w-full h-11 rounded-2xl border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Create Free Account + 24hr Ultra Trial
                </Button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Continue as Guest (Calculator only)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. PRO PLAN REQUIRED MODAL                                      */}
        {/* ============================================================== */}
        {type === 'pro' && (
          <div className="flex flex-col w-full text-foreground">
            {/* Top Indigo/Purple Gradient Header */}
            <div className="bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#8B5CF6] p-6 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3.5 shadow-inner">
                <Crown className="w-5 h-5 text-white" />
              </div>

              <h2 className="text-xl font-black tracking-tight">Pro Plan Required</h2>
              <p className="text-xs text-white/90 mt-1 leading-snug">
                This tool is locked to <span className="font-bold underline">Pro</span> membership and above.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  PRO UNLOCKS THESE TOOLS
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-foreground/85">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Notes & Checklists</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Password Generator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>History & Archives</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Pro Themes</span>
                  </div>
                </div>
              </div>

              {/* Trial Offer Callout */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Claim your <span className="font-bold text-amber-600 dark:text-amber-400">free 24hr Ultra trial</span> from the Membership page — no code needed!
                </p>
              </div>

              {/* Action Button */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={() => {
                    onClose();
                    onNavigateToMembership();
                  }}
                  className="w-full h-11 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5"
                >
                  <Crown className="w-4 h-4" /> View Membership Plans <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. ULTRA PLAN REQUIRED MODAL                                    */}
        {/* ============================================================== */}
        {type === 'ultra' && (
          <div className="flex flex-col w-full text-foreground">
            {/* Top Orange/Amber Gradient Header */}
            <div className="bg-gradient-to-br from-[#FF5500] via-[#FF7700] to-[#FF0055] p-6 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3.5 shadow-inner">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>

              <h2 className="text-xl font-black tracking-tight">Ultra Plan Required</h2>
              <p className="text-xs text-white/90 mt-1 leading-snug">
                This tool is locked to <span className="font-bold underline">Ultra</span> membership and above.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  ULTRA UNLOCKS THESE TOOLS
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-foreground/85">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>To-Do & Tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Budget & Expense</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Date Calculator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Loan & EMI Calc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Discount Calc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Timer & Stopwatch</span>
                  </div>
                </div>
              </div>

              {/* Trial Offer Callout */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-500 shrink-0 fill-amber-500" />
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Claim your <span className="font-bold text-amber-600 dark:text-amber-400">free 24hr Ultra trial</span> from the Membership page — no code needed!
                </p>
              </div>

              {/* Action Button */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={() => {
                    onClose();
                    onNavigateToMembership();
                  }}
                  className="w-full h-11 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5"
                >
                  <Crown className="w-4 h-4" /> View Membership Plans <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
