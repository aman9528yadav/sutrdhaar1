"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/context/ProfileContext';
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthPageProps {
  onLoginSuccess: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthPage({ onLoginSuccess, initialMode = 'login' }: AuthPageProps) {
  const { setProfile, profile } = useProfile();
  const [isLoginView, setIsLoginView] = useState(initialMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (isLoginView) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onLoginSuccess();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, name }
          }
        });
        if (signUpError) throw signUpError;
        if (name) {
          setProfile((prev: any) => ({ ...prev, name: name }));
        }
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'An error occurred';
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError('An error occurred during Google sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first to reset your password.");
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSuccessMsg("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      setError("Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full min-h-full flex flex-col items-center justify-center bg-background px-4 py-8">
      {/* Central White Card matching screenshot */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-[360px] bg-card rounded-[2.5rem] border border-border/50 shadow-2xl p-6 sm:p-7 space-y-5"
      >
        {/* Top Icon Pill */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7928CA] to-[#8B5CF6] text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-foreground tracking-tight">
            {isLoginView ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-xs text-muted-foreground leading-snug max-w-[260px]">
            {isLoginView 
              ? 'Sign in to sync your budgets, tasks, and notes'
              : 'Sign up to start organizing your tools & widgets'}
          </p>
        </div>

        {/* Continue with Google button */}
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="w-full h-11 rounded-2xl border-border/60 bg-background hover:bg-muted font-semibold text-xs text-foreground flex items-center justify-center gap-2 shadow-sm"
          >
            {/* Google colored G icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </Button>
        </div>

        {/* OR Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="w-full border-t border-border/40 absolute" />
          <span className="relative px-3 bg-card text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            OR EMAIL
          </span>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <AnimatePresence mode="wait">
            {!isLoginView && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  FULL NAME
                </Label>
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl text-xs bg-muted/20 border-border/50"
                  required={!isLoginView}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              EMAIL ADDRESS
            </Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                placeholder="priya.sharma@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 pl-9 rounded-xl text-xs bg-muted/20 border-border/50 font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                PASSWORD
              </Label>
              {isLoginView && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pl-9 pr-9 rounded-xl text-xs bg-muted/20 border-border/50 font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 border-border focus:ring-purple-500 accent-purple-600 cursor-pointer"
            />
            <Label htmlFor="rememberMe" className="text-xs font-medium text-foreground/80 cursor-pointer">
              Remember me
            </Label>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs p-2.5 rounded-xl">
              {successMsg}
            </div>
          )}

          {/* Submit Sign In Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#9333EA] hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-1.5 pt-0.5"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isLoginView ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>

          {/* Bottom Switch Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              {isLoginView ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLoginView(!isLoginView)}
                className="font-bold text-primary hover:underline"
              >
                {isLoginView ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
