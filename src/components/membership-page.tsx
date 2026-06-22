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
import { CheckCircle2, Star, Zap, Shield, Clock, Ticket, X, Check, ArrowRight, Quote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export function MembershipPage() {
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
      const { data, error } = await supabase
        .from('membership_codes')
        .select('*')
        .eq('code', redeemCode.trim())
        .single();

      if (error || !data) {
        throw new Error("Invalid or expired code.");
      }

      if (data.is_used) {
        throw new Error("This code has already been used.");
      }

      const { error: updateError } = await supabase
        .from('membership_codes')
        .update({ is_used: true, used_by: profile.email })
        .eq('code', redeemCode.trim());

      if (updateError) {
        throw new Error("Failed to redeem code. Please try again.");
      }

      const durationDays = data.duration_days || 30;
      const durationMs = durationDays * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + durationMs).toISOString();

      await supabase.auth.updateUser({
        data: { 
          membership: data.tier,
          membership_expires_at: expiresAt 
        }
      });

      setProfile(prev => ({
        ...prev,
        membership: data.tier as 'standard' | 'premium',
        membershipExpiresAt: expiresAt
      }));

      toast({
        title: "Code Redeemed Successfully! 🎉",
        description: `You have been upgraded to the ${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)} plan!`,
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

  const tiers = [
    {
      name: "Guest",
      monthlyPrice: "Free",
      yearlyPrice: "Free",
      description: "Perfect for exploring.",
      icon: <Shield className="w-5 h-5 text-slate-400" />,
      features: [
        "Access to Unit Converter",
        "Access to Calculator",
        "Basic Profile",
        "Standard Speed"
      ],
      current: profile.isGuest,
      action: null,
      popular: false
    },
    {
      name: "Standard",
      monthlyPrice: "₹99",
      yearlyPrice: "₹950",
      description: "More tools for daily use.",
      icon: <Star className="w-5 h-5 text-blue-400" />,
      features: [
        "All Guest Features",
        "Access to Basic Tools",
        "History & Analytics",
        "Cloud Sync"
      ],
      current: !profile.isGuest && profile.membership === 'standard',
      action: scrollToRedeem,
      popular: false
    },
    {
      name: "Premium",
      monthlyPrice: "₹199",
      yearlyPrice: "₹1900",
      description: "Unleash full potential.",
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      features: [
        "All Standard Features",
        "Advanced Financial Tools",
        "Priority Support",
        "Custom Themes",
        "Early Access"
      ],
      current: profile.membership === 'premium',
      action: scrollToRedeem,
      popular: true
    }
  ];

  const compareFeatures = [
    { name: "Unit Converter", guest: true, standard: true, premium: true },
    { name: "Basic Calculator", guest: true, standard: true, premium: true },
    { name: "Cloud Sync", guest: false, standard: true, premium: true },
    { name: "History & Analytics", guest: false, standard: true, premium: true },
    { name: "Advanced Tools", guest: false, standard: false, premium: true },
    { name: "Custom Themes", guest: false, standard: false, premium: true },
    { name: "Priority Support", guest: false, standard: false, premium: true },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24">
      {/* Background glowing orbs - scaled for mobile */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/15 rounded-full blur-[80px] -z-10" />
      <div className="absolute top-1/3 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto space-y-8 pt-6 px-4"
      >
        {/* Header Section - Mobile Optimized */}
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-primary/50 text-primary bg-primary/5 px-3 py-1 rounded-full text-xs font-medium mb-2">
            Unlock Your Potential
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
            Membership
          </h1>
          <p className="text-sm md:text-base text-muted-foreground px-2">
            Choose a plan that fits your workflow.
          </p>
        </div>

        {/* Redeem Section - Moved up & Mobile Optimized */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          <Card className="bg-card/80 backdrop-blur-xl border border-primary/20 shadow-[0_4px_20px_-5px_rgba(var(--primary),0.2)] relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl -z-10" />
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" /> Activate Code
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <form onSubmit={handleRedeemCode} className="flex gap-2">
                <Input 
                  id="redeem-input"
                  placeholder="e.g. SUTRA-X8" 
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  className="font-mono text-sm uppercase h-11 bg-background/50 border-white/10"
                />
                <Button type="submit" disabled={isRedeeming || !redeemCode} className="h-11 px-4 font-bold shrink-0">
                  {isRedeeming ? '...' : 'Redeem'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* 24-Hour Trial Card */}
        {showTrialCard && profile.trialClaimedAt !== new Date(0).toISOString() && (
          <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-900/40 border-emerald-500/30 shadow-lg backdrop-blur-xl">
              <div className="absolute -top-6 -right-6 opacity-10">
                <Clock className="w-32 h-32" />
              </div>
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    {isTrialActive ? 'Active' : 'Limited Offer'}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold text-emerald-400">
                   {isTrialActive ? 'Free Trial Active' : '24-Hour Trial'}
                </CardTitle>
                <CardDescription className="text-xs text-foreground/80 mt-1">
                  {isTrialActive ? 'You have access to all features! Enjoy.' : 'Claim a 24-hour pass to unlock ALL tools instantly!'}
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-5 pt-3">
                {!isTrialActive ? (
                  <Button onClick={handleClaimTrial} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-10 rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20">
                    Claim Trial <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                ) : (
                  <Button onClick={handleEndTrial} variant="destructive" className="w-full h-10 rounded-lg text-sm font-bold shadow-lg shadow-red-500/20">
                    End Trial Early
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 py-2">
          <Label htmlFor="billing-toggle" className={`text-sm ${!isYearly ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>Monthly</Label>
          <Switch 
            id="billing-toggle" 
            checked={isYearly} 
            onCheckedChange={setIsYearly} 
            className="data-[state=checked]:bg-primary scale-90"
          />
          <div className="flex items-center gap-1.5">
            <Label htmlFor="billing-toggle" className={`text-sm ${isYearly ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>Yearly</Label>
            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500 text-[10px] px-1.5 py-0 border-none">Save 20%</Badge>
          </div>
        </div>

        {/* Pricing Cards - Mobile Stack */}
        <div className="flex flex-col gap-6">
          {tiers.map((tier, index) => (
            <motion.div 
              key={tier.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (index * 0.1) }}
              className="relative"
            >
              {tier.popular && (
                <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-400 to-purple-600 rounded-2xl opacity-75 blur-[2px] -z-10" />
              )}

              <Card className={`relative flex flex-col bg-card/70 backdrop-blur-xl transition-all rounded-2xl ${
                  tier.popular ? 'border-transparent shadow-[0_8px_30px_-5px_rgba(168,85,247,0.3)]' : 'border-white/5 shadow-md'
                } ${tier.current && !tier.popular ? 'ring-1 ring-primary border-transparent' : ''}`}>
                
                {tier.popular && (
                  <div className="absolute -top-3 inset-x-0 flex justify-center z-20">
                    <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-amber-500/30">
                      Most Popular
                    </span>
                  </div>
                )}
                {tier.current && !tier.popular && (
                  <div className="absolute -top-2.5 inset-x-0 flex justify-center z-20">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Current Plan
                    </span>
                  </div>
                )}
                
                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        {tier.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">{tier.description}</CardDescription>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tier.popular ? 'bg-gradient-to-br from-amber-400/20 to-purple-600/20' : 'bg-white/5'}`}>
                      {tier.icon}
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={isYearly ? 'yearly' : 'monthly'}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="text-3xl font-extrabold text-foreground"
                      >
                        {isYearly ? tier.yearlyPrice : tier.monthlyPrice}
                      </motion.span>
                    </AnimatePresence>
                    {tier.monthlyPrice !== "Free" && (
                      <span className="text-muted-foreground text-xs font-medium">/{isYearly ? 'yr' : 'mo'}</span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-5 pt-0">
                  <div className="bg-black/20 rounded-xl p-4 mt-2">
                    <ul className="space-y-2.5">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${tier.popular ? 'text-amber-500' : 'text-primary'}`} />
                          <span className="text-muted-foreground leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                
                <CardFooter className="p-5 pt-0">
                  {tier.action && !tier.current && (
                    <Button 
                      onClick={tier.action} 
                      className={`w-full h-10 rounded-lg text-sm font-bold ${
                        tier.popular 
                          ? 'bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 text-white shadow-lg shadow-purple-500/25' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      Enter Code to Upgrade
                    </Button>
                  )}
                  {tier.current && (
                    <Button onClick={handleCancelMembership} variant="destructive" className="w-full h-10 rounded-lg text-sm font-bold">
                      Cancel Plan
                    </Button>
                  )}
                  {!tier.action && !tier.current && (
                    <Button disabled variant="outline" className="w-full h-10 rounded-lg text-sm border-white/5 bg-white/5">
                      Included
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison - Mobile Card Layout */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-8"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Compare Features</h2>
          </div>
          <div className="grid gap-3">
            {compareFeatures.map((feature, idx) => (
              <Card key={idx} className="bg-card/40 border-white/5 backdrop-blur-sm overflow-hidden">
                <div className="p-3 bg-white/5 font-semibold text-sm border-b border-white/5">
                  {feature.name}
                </div>
                <div className="grid grid-cols-3 p-3 text-center text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-muted-foreground/60">Guest</span>
                    {feature.guest ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-muted-foreground/30" />}
                  </div>
                  <div className="flex flex-col items-center gap-1 border-x border-white/5">
                    <span className="text-muted-foreground/80">Std</span>
                    {feature.standard ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-muted-foreground/30" />}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-amber-500 font-medium">Pro</span>
                    {feature.premium ? <Check className="w-4 h-4 text-amber-500" /> : <X className="w-4 h-4 text-muted-foreground/30" />}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Testimonial Section - Mobile Optimized */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-8"
        >
          <div className="bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-white/10 rounded-2xl p-6 text-center relative overflow-hidden backdrop-blur-sm">
            <Quote className="absolute top-2 left-2 w-12 h-12 text-white/5 rotate-180" />
            <div className="flex justify-center mb-4">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-purple-400 to-amber-400 flex items-center justify-center text-white font-bold text-[10px]`}>
                    U{i}
                  </div>
                ))}
              </div>
            </div>
            <h3 className="text-lg font-bold mb-2">"Transformed my workflow."</h3>
            <p className="text-muted-foreground text-xs">
              Join thousands of professionals who have upgraded their experience.
            </p>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pb-8"
        >
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold">FAQs</h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="item-1" className="bg-card/40 backdrop-blur-sm border border-white/10 rounded-xl px-3 data-[state=open]:bg-white/5">
              <AccordionTrigger className="hover:no-underline font-medium text-sm py-3 text-left">Can I cancel at any time?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-xs pb-3">
                Yes, cancel anytime. Access remains until the end of your billing period.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="bg-card/40 backdrop-blur-sm border border-white/10 rounded-xl px-3 data-[state=open]:bg-white/5">
              <AccordionTrigger className="hover:no-underline font-medium text-sm py-3 text-left">How does the free trial work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-xs pb-3">
                Get 24h instant access to Premium. No credit card required. Auto-downgrades to Guest after.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="bg-card/40 backdrop-blur-sm border border-white/10 rounded-xl px-3 data-[state=open]:bg-white/5">
              <AccordionTrigger className="hover:no-underline font-medium text-sm py-3 text-left">How do I upgrade my plan?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-xs pb-3">
                Purchase or obtain an activation code and enter it in the "Activate Code" section at the top.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

      </motion.div>
    </div>
  );
}
