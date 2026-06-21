"use client";

import React, { useState } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin, Save, Shield, Star, Calendar, Flame, Settings, Hexagon, LogIn, LogOut, ChevronRight, ArrowLeft, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function ProfilePage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { profile, setProfile, logout } = useProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    address: profile.address || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSave = () => {
    setProfile(prev => ({
      ...prev,
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      // email is intentionally omitted since it can't be changed here
    }));
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
    setIsEditing(false);
  };

  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <motion.div 
          key="edit-view"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="max-w-2xl mx-auto space-y-6 pb-20 px-4 pt-4"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="shrink-0 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-16 h-16 border-2 border-primary/20 shadow-xl">
              <AvatarImage src={profile.photoUrl} alt="User Avatar" />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Edit Profile</h1>
            </div>
          </div>

          <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="pl-9 h-12 bg-black/20 border-transparent focus-visible:ring-primary/50 transition-all rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2 opacity-60">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address (Cannot be changed)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    placeholder="you@example.com"
                    className="pl-9 h-12 bg-black/20 border-transparent transition-all rounded-xl cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="pl-9 h-12 bg-black/20 border-transparent focus-visible:ring-primary/50 transition-all rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main St, City, Country"
                    className="pl-9 h-12 bg-black/20 border-transparent focus-visible:ring-primary/50 transition-all rounded-xl"
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full h-12 rounded-xl text-md font-semibold mt-6 gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div 
          key="default-view"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-2xl mx-auto flex flex-col items-center pb-20 px-4"
        >
          <div className="flex flex-col items-center mt-6">
            <Avatar className="w-24 h-24 border-2 border-primary/20 shadow-2xl mb-4">
              <AvatarImage src={profile.photoUrl} alt="User Avatar" />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col items-center gap-2 mt-2">
              <h1 className="text-2xl font-bold text-center tracking-tight flex items-center gap-2">
                {profile.name || 'Guest User'}
                {profile.membership === 'premium' && (
                  <span className="bg-purple-500/20 text-purple-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border border-purple-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Premium
                  </span>
                )}
                {profile.membership === 'standard' && (
                  <span className="bg-indigo-500/20 text-indigo-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border border-indigo-500/30 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Standard
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground text-sm">{profile.email || 'No email'}</p>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)} 
              className="mt-6 rounded-full px-6 h-10 bg-transparent border-white/20 hover:bg-white/5 gap-2"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              Profile Settings
            </Button>
          </div>

          <div 
            className="mt-8 w-full max-w-sm mx-auto bg-gradient-to-tr from-primary to-orange-500 rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 relative overflow-hidden"
            onClick={() => onNavigate?.('progression')}
          >
            <div className="absolute -right-4 -top-4 opacity-20">
              <Star className="w-24 h-24 text-white" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Your Progression</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-white">Level {profile.stats?.level || 1}</span>
                  <span className="text-white/90 text-sm font-medium">({profile.stats?.xp || 0} XP)</span>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 w-full max-w-sm mx-auto">
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-2xl font-bold">{profile.stats?.allTimeActivities || 0}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Total</span>
            </div>
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-2xl font-bold">{profile.stats?.todayActivities || 0}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Today</span>
            </div>
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-3">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-2xl font-bold">{profile.stats?.streak || 1}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Streak</span>
            </div>
          </div>

          <div className="mt-10 w-full max-w-sm mx-auto">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 pl-1">Preferences</h2>
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg">
              <div 
                className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => onNavigate?.('settings')}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                    <Settings className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Settings</p>
                    <p className="text-xs text-muted-foreground mt-0.5">App configuration & preferences</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div 
                className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => onNavigate?.('membership')}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-purple-500/10 rounded-xl">
                    <Hexagon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Membership</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Premium</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="mt-8 w-full max-w-sm mx-auto">
            <Button 
              onClick={logout} 
              className="w-full h-14 rounded-2xl text-md font-bold bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-xl shadow-green-500/20 transition-all gap-2"
            >
              {profile.isGuest ? (
                <><LogIn className="w-5 h-5" /> Sign In</>
              ) : (
                <><LogOut className="w-5 h-5" /> Sign Out</>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
