"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Star, Zap, Shield, Clock, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export function MembershipPage() {
  const { profile, setProfile } = useProfile();
  const { toast } = useToast();
  const [redeemCode, setRedeemCode] = React.useState('');
  const [isRedeeming, setIsRedeeming] = React.useState(false);

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
      // Find the code in the database
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

      // Mark code as used
      const { error: updateError } = await supabase
        .from('membership_codes')
        .update({ is_used: true, used_by: profile.email })
        .eq('code', redeemCode.trim());

      if (updateError) {
        throw new Error("Failed to redeem code. Please try again.");
      }

      // Use the code's duration if set, otherwise default to 30 days
      const durationDays = data.duration_days || 30;
      const durationMs = durationDays * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + durationMs).toISOString();

      // Update Supabase auth metadata to persist membership
      await supabase.auth.updateUser({
        data: { 
          membership: data.tier,
          membership_expires_at: expiresAt 
        }
      });

      // Upgrade the user locally
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
    document.getElementById('redeem-section')?.scrollIntoView({ behavior: 'smooth' });
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
    
    // Update Supabase auth metadata
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

    // Update local profile state
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
      const expiredDate = new Date(0).toISOString(); // 1970 - expired forever
      await supabase.auth.updateUser({ data: { trial_claimed_at: expiredDate } });
      setProfile(prev => ({ ...prev, trialClaimedAt: expiredDate }));
      toast({ title: "Trial Ended", description: "Your free trial has been ended." });
    }
  };

  const handleCancelMembership = async () => {
    if (window.confirm("Are you sure you want to cancel your membership? You will lose access to premium features immediately.")) {
      // Delete the used code from the admin database
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
      price: "Free",
      icon: <Shield className="w-6 h-6 text-slate-400" />,
      features: [
        "Access to Unit Converter",
        "Access to Calculator",
        "Basic Profile"
      ],
      current: profile.isGuest,
      action: null
    },
    {
      name: "Standard",
      price: "₹99/mo",
      icon: <Star className="w-6 h-6 text-blue-400" />,
      features: [
        "All Guest Features",
        "Access to Basic Tools",
        "History & Analytics",
        "Cloud Sync"
      ],
      current: !profile.isGuest && profile.membership === 'standard',
      action: scrollToRedeem
    },
    {
      name: "Premium",
      price: "₹199/mo",
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      features: [
        "All Standard Features",
        "Advanced Financial Tools",
        "Priority Support",
        "Custom Themes"
      ],
      current: profile.membership === 'premium',
      action: scrollToRedeem
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      <div className="text-center space-y-3 pt-6 px-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Membership Plans</h1>
        <p className="text-sm text-muted-foreground">Choose the perfect plan to unlock the full potential of your tools.</p>
      </div>

      {/* 24-Hour Trial Card */}
      {showTrialCard && profile.trialClaimedAt !== new Date(0).toISOString() && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-4 px-4"
        >
          <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Clock className="w-32 h-32" />
            </div>
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-lg shadow-emerald-500/20">
                  {isTrialActive ? 'Active Now' : 'Limited Offer'}
                </span>
              </div>
              <CardTitle className="text-2xl text-emerald-500 flex items-center gap-2">
                 {isTrialActive ? 'Free Trial Active' : '24-Hour Free Trial'}
              </CardTitle>
              <CardDescription className="text-base text-foreground/80 max-w-[80%]">
                {isTrialActive ? 'You currently have access to all tools and features! Enjoy your 24 hours.' : 'New to the app? Claim a 24-hour pass to unlock ALL tools and features instantly, bypassing all level requirements!'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="relative z-10 flex gap-3">
              {!isTrialActive ? (
                <Button onClick={handleClaimTrial} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl font-bold px-8 shadow-lg shadow-emerald-500/20">
                  Claim Free Trial Now
                </Button>
              ) : (
                <Button onClick={handleEndTrial} variant="destructive" className="w-full sm:w-auto h-12 rounded-xl font-bold px-8 shadow-lg shadow-red-500/20">
                  End Trial Early
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-5 pt-4 px-4">
        {tiers.map((tier, index) => (
          <motion.div 
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`relative h-full flex flex-col bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl transition-all ${tier.current ? 'ring-2 ring-primary border-transparent' : 'hover:border-white/20'}`}>
              {tier.current && (
                <div className="absolute -top-3 inset-x-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Current Plan
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
                  {tier.icon}
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground mt-2">{tier.price}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow pt-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                {tier.action && !tier.current && (
                  <Button 
                    onClick={tier.action} 
                    className={`w-full h-12 rounded-xl font-bold ${tier.name === 'Premium' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
                    variant={tier.name === 'Premium' ? 'default' : 'outline'}
                  >
                    Redeem Code
                  </Button>
                )}
                {tier.current && (
                  <Button onClick={handleCancelMembership} variant="destructive" className="w-full h-12 rounded-xl">
                    Cancel Membership
                  </Button>
                )}
                {!tier.action && !tier.current && (
                  <Button disabled variant="outline" className="w-full h-12 rounded-xl border-dashed">
                    Included
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
      <div id="redeem-section" className="mt-12 px-4">
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Redeem a Code
            </CardTitle>
            <CardDescription>
              Have a special activation code? Enter it below to instantly upgrade your membership.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeemCode} className="flex gap-3">
              <Input 
                placeholder="Enter 8-character code (e.g. SUTRA-X8F9)" 
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                className="font-mono uppercase h-12"
              />
              <Button type="submit" disabled={isRedeeming || !redeemCode} className="h-12 px-8">
                {isRedeeming ? 'Verifying...' : 'Redeem'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

    </motion.div>
  );
}
