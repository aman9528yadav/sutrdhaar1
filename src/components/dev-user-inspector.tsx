"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Users, RefreshCw, Crown, Calendar, Clock, Mail, 
  Phone, MapPin, Shield, Zap, Sparkles, ChevronRight, X, 
  Award, Activity, FileText, CheckSquare, Receipt, Copy, Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/context/ProfileContext';

export interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  photoUrl?: string;
  membership?: string;
  membershipExpiresAt?: string;
  createdAt?: string;
  lastActive?: string;
  isGuest?: boolean;
  level?: number;
  xp?: number;
  streak?: number;
  daysActive?: number;
  allTimeActivities?: number;
  notesCount?: number;
  todosCount?: number;
  budgetCount?: number;
  enableBiometric?: boolean;
}

export function DevUserInspector() {
  const { profile: currentProfile } = useProfile();
  const [users, setUsers] = useState<UserDirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'premium' | 'member' | 'guest'>('all');
  const [selectedUser, setSelectedUser] = useState<UserDirectoryItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const userMap = new Map<string, UserDirectoryItem>();

      // 1. Current logged-in active profile
      if (currentProfile?.email) {
        userMap.set(currentProfile.email.toLowerCase(), {
          id: currentProfile.email,
          name: currentProfile.name || 'Current User',
          email: currentProfile.email,
          phone: currentProfile.phone,
          address: currentProfile.address,
          photoUrl: currentProfile.photoUrl,
          membership: currentProfile.membership || 'member',
          membershipExpiresAt: currentProfile.membershipExpiresAt,
          createdAt: currentProfile.stats?.lastAppOpenDate || new Date().toISOString(),
          lastActive: currentProfile.stats?.lastActivityDate || currentProfile.stats?.lastAppOpenDate || new Date().toISOString(),
          isGuest: Boolean(currentProfile.isGuest),
          level: currentProfile.stats?.level || 1,
          xp: currentProfile.stats?.xp || 0,
          streak: currentProfile.stats?.streak || 0,
          daysActive: currentProfile.stats?.daysActive || 1,
          allTimeActivities: currentProfile.stats?.allTimeActivities || 0,
          notesCount: currentProfile.notes?.length || 0,
          todosCount: currentProfile.todos?.length || 0,
          budgetCount: currentProfile.budget?.expenses?.length || 0,
          enableBiometric: Boolean(currentProfile.settings?.enableBiometricAuth),
        });
      }

      // 2. Fetch all user accounts from support_sessions (live connected accounts)
      const { data: sessionRows } = await supabase
        .from('support_sessions')
        .select('*')
        .order('last_updated', { ascending: false });

      if (sessionRows) {
        for (const s of sessionRows) {
          const email = (s.user_id || '').toLowerCase();
          if (!email) continue;
          const existing = userMap.get(email);
          const lastActiveIso = s.last_updated ? new Date(s.last_updated).toISOString() : new Date().toISOString();
          
          if (existing) {
            existing.lastActive = lastActiveIso;
            if (!existing.name || existing.name === 'Current User') {
              existing.name = s.user_name || existing.name;
            }
          } else {
            userMap.set(email, {
              id: email,
              name: s.user_name || email.split('@')[0],
              email: email,
              membership: email === 'amanyadavyadav9458@gmail.com' ? 'owner' : 'member',
              createdAt: lastActiveIso,
              lastActive: lastActiveIso,
              isGuest: false,
              level: 1,
              xp: 100,
              streak: 1,
              daysActive: 1,
              allTimeActivities: 5,
              notesCount: 0,
              todosCount: 0,
              budgetCount: 0,
            });
          }
        }
      }

      // 3. Fetch from membership_codes assigned accounts
      const { data: codeRows } = await supabase
        .from('membership_codes')
        .select('*');

      if (codeRows) {
        for (const c of codeRows) {
          const email = (c.used_by || c.assigned_email || '').toLowerCase();
          if (!email) continue;
          const existing = userMap.get(email);
          if (existing) {
            existing.membership = c.tier || existing.membership;
            if (c.assigned_name && (!existing.name || existing.name === email.split('@')[0])) {
              existing.name = c.assigned_name;
            }
            if (c.created_at && (!existing.createdAt || new Date(c.created_at) < new Date(existing.createdAt))) {
              existing.createdAt = c.created_at;
            }
          } else {
            userMap.set(email, {
              id: email,
              name: c.assigned_name || email.split('@')[0],
              email: email,
              membership: c.tier || 'premium',
              createdAt: c.created_at || new Date().toISOString(),
              lastActive: c.created_at || new Date().toISOString(),
              isGuest: false,
              level: 2,
              xp: 250,
              streak: 1,
              daysActive: 1,
              allTimeActivities: 12,
            });
          }
        }
      }

      // 4. Also fetch from user_profiles if accessible by current session
      try {
        const { data: profileRows } = await supabase
          .from('user_profiles')
          .select('id, data, updated_at');

        if (profileRows && profileRows.length > 0) {
          for (const row of profileRows) {
            const d = row.data || {};
            const email = (d.email || row.id || '').toLowerCase();
            if (!email) continue;
            userMap.set(email, {
              id: row.id,
              name: d.name || email.split('@')[0],
              email: d.email || email,
              phone: d.phone,
              address: d.address,
              photoUrl: d.photoUrl,
              membership: d.membership || 'member',
              membershipExpiresAt: d.membershipExpiresAt,
              createdAt: d.stats?.lastAppOpenDate || row.updated_at,
              lastActive: row.updated_at || d.stats?.lastActivityDate,
              isGuest: Boolean(d.isGuest),
              level: d.stats?.level || 1,
              xp: d.stats?.xp || 0,
              streak: d.stats?.streak || 0,
              daysActive: d.stats?.daysActive || 1,
              allTimeActivities: d.stats?.allTimeActivities || 0,
              notesCount: d.notes?.length || 0,
              todosCount: d.todos?.length || 0,
              budgetCount: d.budget?.expenses?.length || 0,
              enableBiometric: Boolean(d.settings?.enableBiometricAuth),
            });
          }
        }
      } catch (err) {
        console.warn("User profiles direct scan skipped", err);
      }

      setUsers(Array.from(userMap.values()));
    } catch (e) {
      console.error("Failed to load user directory", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      (u.name || '').toLowerCase().includes(query) || 
      (u.email || '').toLowerCase().includes(query) ||
      (u.phone || '').toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (filterTier === 'premium') return u.membership === 'premium' || u.membership === 'owner';
    if (filterTier === 'member') return u.membership === 'member';
    if (filterTier === 'guest') return u.isGuest || u.membership === 'guest';
    return true;
  });

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Unknown';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Not available';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      {/* Header Banner */}
      <div className="p-5 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                User Directory & Accounts
                <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-[10px] uppercase font-black tracking-widest px-1.5 py-0">
                  {users.length} Total
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Browse registered users, plan tiers, usage statistics & account details.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchUsers}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10 gap-1.5 font-bold self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-card/60 border-border/50 text-sm focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'premium', 'member', 'guest'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all shrink-0 ${
                  filterTier === tier
                    ? 'bg-amber-500 text-black shadow-md font-bold'
                    : 'bg-card/40 border border-border/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <p className="text-xs">Scanning database accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-border/40 bg-card/20 space-y-2">
            <Users className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
            <p className="text-sm font-semibold">No users found</p>
            <p className="text-xs text-muted-foreground">Try a different search query or filter.</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isOwner = user.email === 'amanyadavyadav9458@gmail.com' || user.membership === 'owner';
            const isPremium = user.membership === 'premium';
            const initials = (user.name || user.email || 'U').slice(0, 2).toUpperCase();

            return (
              <motion.div
                key={user.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedUser(user)}
                className="p-3.5 rounded-2xl border border-border/40 bg-card/40 hover:bg-card/80 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <Avatar className="w-10 h-10 border border-border/60">
                      {user.photoUrl && <AvatarImage src={user.photoUrl} />}
                      <AvatarFallback className="bg-amber-500/10 text-amber-500 font-bold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isOwner && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[9px] font-black">
                        👑
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-amber-500 transition-colors">
                        {user.name}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 font-bold capitalize ${
                          isOwner 
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' 
                            : isPremium 
                            ? 'border-purple-500/40 bg-purple-500/10 text-purple-400'
                            : 'border-border/60 text-muted-foreground'
                        }`}
                      >
                        {user.membership || 'member'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Active</span>
                    <span className="text-xs font-semibold text-foreground">
                      {formatRelativeTime(user.lastActive)}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-card/60 border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-amber-500 group-hover:border-amber-500/40 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* User Details Slide-over / Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2rem] bg-card border border-border/60 shadow-2xl p-6 space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-2 border-amber-500/30">
                    {selectedUser.photoUrl && <AvatarImage src={selectedUser.photoUrl} />}
                    <AvatarFallback className="bg-amber-500/20 text-amber-500 font-bold text-base">
                      {(selectedUser.name || selectedUser.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      {selectedUser.name}
                      {selectedUser.membership === 'owner' && <span>👑</span>}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <span>{selectedUser.email}</span>
                      <button 
                        onClick={() => handleCopy(selectedUser.email, 'email')}
                        className="text-muted-foreground hover:text-amber-500 transition-colors"
                      >
                        {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Membership & Status Badge Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-card/60 border border-border/40 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" /> Plan Tier
                  </span>
                  <div className="font-bold text-sm text-foreground capitalize">
                    {selectedUser.membership || 'Free Member'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-card/60 border border-border/40 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> Last Active
                  </span>
                  <div className="font-bold text-sm text-foreground">
                    {formatRelativeTime(selectedUser.lastActive)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-card/60 border border-border/40 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" /> Security Lock
                  </span>
                  <div className="font-bold text-sm text-foreground">
                    {selectedUser.enableBiometric ? 'Biometric ON' : 'Standard'}
                  </div>
                </div>
              </div>

              {/* Account Details & Metadata */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Account Timeline & Info
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" /> Member Since
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatDate(selectedUser.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Last App Sync
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatDate(selectedUser.lastActive)}
                    </span>
                  </div>

                  {selectedUser.phone && (
                    <div className="flex items-center justify-between py-1 border-b border-border/20">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone
                      </span>
                      <span className="font-semibold text-foreground">
                        {selectedUser.phone}
                      </span>
                    </div>
                  )}

                  {selectedUser.address && (
                    <div className="flex items-center justify-between py-1 border-b border-border/20">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" /> Location
                      </span>
                      <span className="font-semibold text-foreground">
                        {selectedUser.address}
                      </span>
                    </div>
                  )}

                  {selectedUser.membershipExpiresAt && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 text-purple-400" /> Plan Expiry
                      </span>
                      <span className="font-semibold text-purple-400">
                        {formatDate(selectedUser.membershipExpiresAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity & Usage Statistics */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-500" /> Usage & Storage Stats
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-card/60 text-center border border-border/30">
                    <div className="text-lg font-black text-foreground">{selectedUser.notesCount ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center justify-center gap-1">
                      <FileText className="w-2.5 h-2.5" /> Notes
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-card/60 text-center border border-border/30">
                    <div className="text-lg font-black text-foreground">{selectedUser.todosCount ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center justify-center gap-1">
                      <CheckSquare className="w-2.5 h-2.5" /> Todos
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-card/60 text-center border border-border/30">
                    <div className="text-lg font-black text-foreground">{selectedUser.streak ?? 1}🔥</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Streak Days</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-card/60 text-center border border-border/30">
                    <div className="text-lg font-black text-foreground">Lv. {selectedUser.level ?? 1}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center justify-center gap-1">
                      <Award className="w-2.5 h-2.5" /> {selectedUser.xp ?? 0} XP
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="w-full h-11 rounded-xl font-bold"
              >
                Close Profile Details
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
