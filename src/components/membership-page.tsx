"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { CheckCircle2, Star, Zap, Shield, Clock, Ticket, X, Check, ArrowRight, Quote, Key, Sparkles, User, ChevronRight, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export function MembershipPage({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { profile, setProfile } = useProfile();
  const { toast } = useToast();
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;

    if (profile.isGuest) {
      toast({
        title: "Account Required",
        description: "Please sign in or create an account to redeem a code.",
        variant: "destructive"
      });
      return;
    }

    setIsRedeeming(true);
    try {
      const cleanCode = redeemCode.trim().toUpperCase();
      let codeData: any = null;

      // 1. Try fetching from Supabase
      try {
        const { data, error } = await supabase
          .from('membership_codes')
          .select('*')
          .eq('code', cleanCode)
          .single();
        if (!error && data) {
          codeData = data;
        }
      } catch (e) {
        console.warn("Supabase check error:", e);
      }

      // 2. If not found in Supabase, check local storage (e.g. generated offline or in dev mode)
      if (!codeData) {
        try {
          const stored = localStorage.getItem('sutra_membership_codes');
          if (stored) {
            const list = JSON.parse(stored);
            const found = list.find((c: any) => c.code === cleanCode);
            if (found) {
              codeData = found;
            }
          }
        } catch (e) {
          console.warn("Local storage check error:", e);
        }
      }

      if (!codeData) {
        throw new Error("Invalid or expired code.");
      }

      if (codeData.is_revoked) {
        throw new Error("This license code has been temporarily revoked / paused by admin.");
      }

      if (codeData.is_used) {
        throw new Error("This code has already been used.");
      }

      // Mark used in Supabase if exists
      try {
        await supabase
          .from('membership_codes')
          .update({ is_used: true, used_by: profile.email })
          .eq('code', cleanCode);
      } catch (e) {
        console.warn("Could not update code on Supabase:", e);
      }

      // Mark used in localStorage
      try {
        const stored = localStorage.getItem('sutra_membership_codes');
        if (stored) {
          const list = JSON.parse(stored);
          const updated = list.map((c: any) => c.code === cleanCode ? { ...c, is_used: true, used_by: profile.email } : c);
          localStorage.setItem('sutra_membership_codes', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn("Could not update code in localStorage:", e);
      }

      const durationDays = codeData.duration_days || 30;
      const durationMs = durationDays * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + durationMs).toISOString();

      try {
        await supabase.auth.updateUser({
          data: { 
            membership: codeData.tier,
            membership_expires_at: expiresAt 
          }
        });
      } catch (e) {
        console.warn("Supabase user metadata update notice:", e);
      }

      setProfile(prev => ({
        ...prev,
        membership: codeData.tier as 'standard' | 'premium',
        membershipExpiresAt: expiresAt
      }));

      toast({
        title: "Code Redeemed Successfully! 🎉",
        description: `You have been upgraded to the ${codeData.tier.charAt(0).toUpperCase() + codeData.tier.slice(1)} plan!`,
      });
      setRedeemCode('');
    } catch (err: any) {
      toast({
        title: "Redemption Failed",
        description: err.message || "Invalid code.",
        variant: "destructive"
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const scrollToRedeem = () => {
    // In the new layout, redeem is at the top, so we scroll to top or just focus the input
    document.getElementById('redeem-input')?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClaimTrial = async () => {
    if (profile.isGuest) {
      toast({
        title: "Account Required",
        description: "Please sign in or create a free account to claim your 24-hour trial.",
        variant: "destructive"
      });
      return;
    }

    const trialTime = new Date().toISOString();
    
    const { error } = await supabase.auth.updateUser({
      data: { trial_claimed_at: trialTime }
    });

    if (error) {
      toast({
        title: "Failed to claim",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setProfile(prev => ({
      ...prev,
      trialClaimedAt: trialTime
    }));

    toast({
      title: "24-Hour Free Trial Activated! 🎉",
      description: "All level restrictions have been lifted for 24 hours. Enjoy!",
    });
  };

  const handleEndTrial = async () => {
    if (window.confirm("Are you sure you want to end your free trial early? This cannot be undone.")) {
      const expiredDate = new Date(0).toISOString();
      await supabase.auth.updateUser({ data: { trial_claimed_at: expiredDate } });
      setProfile(prev => ({ ...prev, trialClaimedAt: expiredDate }));
      toast({ title: "Trial Ended", description: "Your free trial has been ended." });
    }
  };

  const handleCancelMembership = async () => {
    if (window.confirm("Are you sure you want to cancel your membership? You will lose access to premium features immediately.")) {
      if (profile.email) {
        await supabase.from('membership_codes').delete().eq('used_by', profile.email);
      }
      
      await supabase.auth.updateUser({ data: { membership: null, membership_expires_at: null } });
      setProfile(prev => ({ ...prev, membership: undefined, membershipExpiresAt: undefined }));
      toast({ title: "Membership Canceled", description: "Your membership has been canceled." });
    }
  };

  const isTrialActive = profile.trialClaimedAt && new Date().getTime() < new Date(profile.trialClaimedAt).getTime() + (24 * 60 * 60 * 1000);
  const showTrialCard = !profile.trialClaimedAt || isTrialActive;

  // Calculate active membership details
  const isUltraOrPremium = profile.membership === 'premium' || (profile.membership as any) === 'ultra';
  const isMemberActive = isUltraOrPremium || profile.membership === 'standard';
  
  let remainingDaysText = 'Active';
  if (profile.membershipExpiresAt) {
    const msLeft = Math.max(0, new Date(profile.membershipExpiresAt).getTime() - Date.now());
    const d = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    const h = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    remainingDaysText = `${d}d ${h}h remaining`;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24 px-4 pt-4">
      {/* Background ambient accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto space-y-4"
      >

        {/* 1. Membership Activation Status Banner Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 shadow-sm relative overflow-hidden space-y-4">
          {/* Subtle accent glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Top Pass Badge */}
          <div className="flex items-center justify-between relative z-10">
            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> SUTRADHAAR PASS
            </span>
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              Active: <span className="font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wide bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">{profile.membership || (isTrialActive ? 'Trial' : 'Free')}</span>
            </span>
          </div>

          {/* Heading with crisp high contrast matching app theme */}
          <div className="relative z-10 space-y-1.5">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Membership Activation
            </h2>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed max-w-sm">
              Pro & Ultra plans require an authorized license code issued by developer or support.
            </p>
          </div>

          {/* Inner Validity Box */}
          <div className="p-4 rounded-2xl bg-card border border-border/60 flex items-center justify-between relative z-10 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Membership Validity
              </div>
              <p className="text-[12px] font-mono font-medium text-muted-foreground">
                Key: <span className="text-primary font-bold tracking-wider">{profile.email ? `USR-${profile.email.slice(0, 4).toUpperCase()}` : 'SYPS-AUTO-ACTIVE'}</span>
              </p>
            </div>

            <div className="text-right space-y-1.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm inline-block">
                {isUltraOrPremium ? 'ULTRA ACTIVE' : profile.membership === 'standard' ? 'PRO ACTIVE' : isTrialActive ? 'TRIAL ACTIVE' : 'FREE TIER'}
              </span>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold tracking-tight">
                {isMemberActive ? remainingDaysText : isTrialActive ? '24h Trial Active' : 'No Expiry'}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Free 24-Hour Trial Card */}
        {showTrialCard && (
          <div className="p-5 rounded-3xl border border-amber-500/25 bg-card/60 backdrop-blur-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  Free 24-Hour Ultra Trial
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-600 bg-amber-500/15 border border-amber-500/30">
                One-Time Claim
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Claim a 24-hour full access Ultra pass to test all features and utilities without needing a license code.
            </p>

            {!isTrialActive ? (
              <Button 
                onClick={handleClaimTrial} 
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Claim Free 24-Hour Ultra Trial Now
              </Button>
            ) : (
              <Button 
                onClick={handleEndTrial} 
                variant="destructive"
                className="w-full h-10 rounded-2xl text-xs font-bold"
              >
                End Free Trial Early
              </Button>
            )}
          </div>
        )}

        {/* 3. Redeem License Code Box */}
        <div className="p-5 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                Redeem License Code
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20">
              Required for Pro / Ultra
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Enter your unique license key to unlock Pro or Ultra privileges.
          </p>

          <form onSubmit={handleRedeemCode} className="space-y-3">
            <Input 
              id="redeem-input"
              placeholder="E.G. SUTRA-XXXX-XXXX" 
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              className="font-mono text-center tracking-widest uppercase h-11 bg-background/50 border-border/40 rounded-2xl text-xs"
            />
            <Button 
              type="submit" 
              disabled={isRedeeming || !redeemCode} 
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-500/20 gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              {isRedeeming ? 'Validating Key...' : 'Activate Code'}
            </Button>
          </form>
        </div>

        {/* 4. Plan 1: Basic Free */}
        <div className="p-5 rounded-3xl border border-border/40 bg-card/50 backdrop-blur-xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-foreground">Basic Free</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-muted text-muted-foreground">Starter</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Essential offline productivity and basic calculations.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xl font-extrabold text-foreground">₹0 <span className="text-xs text-muted-foreground font-normal">Forever free</span></span>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 px-3 rounded-xl text-xs font-semibold bg-background/80 border-border/50 text-foreground hover:bg-muted"
            >
              {profile.isGuest || !profile.membership ? 'Current Plan' : 'Switch to Free Basic'}
            </Button>
          </div>

          <div className="pt-2 border-t border-border/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Included Features</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">Smart Calculator & Converter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">Preferences & Hub</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">Clean Light & Dark themes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">Local browser storage</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Plan 2: Pro Member */}
        <div className="p-5 rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.03] backdrop-blur-xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-foreground">Pro Member</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Most Popular</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Expands Basic with Password Generator, Notes and Budget.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xl font-extrabold text-foreground">₹149 <span className="text-xs text-muted-foreground font-normal">per month</span></span>
            <Button 
              size="sm" 
              onClick={scrollToRedeem}
              className="h-8 px-3 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500 hover:text-black gap-1"
            >
              <Key className="w-3 h-3" /> Requires Code
            </Button>
          </div>

          <div className="pt-2 border-t border-border/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Included Features</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">Everything in Basic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">Password Gen with entropy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">Notes & Checklists</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">Budget & Expense tracker</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Plan 3: Ultra VIP */}
        <div className="p-5 rounded-3xl border border-amber-500/25 bg-amber-500/[0.03] backdrop-blur-xl space-y-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-foreground">Ultra VIP</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500 border border-amber-500/30">Ultimate Power</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Unlocks everything! All tools, tasks, widgets and priority VIP.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xl font-extrabold text-foreground">₹349 <span className="text-xs text-muted-foreground font-normal">per month</span></span>
            {isUltraOrPremium ? (
              <span className="px-3 py-1 rounded-full text-xs font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3" /> Active Plan
              </span>
            ) : (
              <Button 
                size="sm" 
                onClick={scrollToRedeem}
                className="h-8 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 shadow-md shadow-orange-500/20 gap-1"
              >
                <Key className="w-3 h-3" /> Activate Ultra
              </Button>
            )}
          </div>

          <div className="pt-2 border-t border-border/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Included Features</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">Everything in Pro & Basic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">Unlocks all tools & widgets</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">Priority VIP cloud sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">All custom themes included</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Bottom Active Account Bar */}
        <div className="p-3.5 rounded-2xl bg-card/40 border border-border/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4 text-primary" />
            <span>Active Account: <span className="font-semibold text-foreground">{profile.name || profile.email || 'Guest User'}</span></span>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'profile' }))}
            className="h-7 px-2 text-xs font-semibold text-primary hover:text-primary/80 gap-1 p-0"
          >
            Manage Profile <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
