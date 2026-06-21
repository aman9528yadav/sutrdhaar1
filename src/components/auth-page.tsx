"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/context/ProfileContext';
import { Sparkles, ArrowRight, Lock, User, Mail, Loader2, AlertCircle, Eye, EyeOff, Github, Chrome } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const { setProfile, profile } = useProfile();
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordScore = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };
  const pwScore = getPasswordScore(password);
  const pwColor = pwScore < 50 ? 'bg-red-500' : pwScore < 100 ? 'bg-yellow-500' : 'bg-green-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!isLoginView && !agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
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

  const handleSSOLogin = async (provider: 'google' | 'github') => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
      // Note: OAuth redirects, so onLoginSuccess might not trigger here directly.
    } catch (err: any) {
      console.error(err);
      setError('An error occurred during social login');
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
    } catch(err: any) {
      setError("Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Use local guest profile since Firebase anonymous login might be disabled
      setProfile((prev: any) => ({
        ...prev,
        isAuthenticated: true,
        isGuest: true,
        membership: 'guest',
        name: 'Guest User'
      }));
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setError('An error occurred during guest login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-background relative overflow-y-auto py-10">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm px-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6 shadow-xl border border-primary/20 backdrop-blur-xl">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50 tracking-tight">
            {isLoginView ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isLoginView 
              ? 'Enter your credentials to access your workspace' 
              : 'Sign up to start organizing your life locally'}
          </p>
        </motion.div>

        <motion.div
          layout
          className="bg-card/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLoginView && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-12 bg-black/20 border-transparent focus-visible:ring-primary/50 transition-all rounded-xl"
                      required={!isLoginView}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-12 bg-black/20 border-transparent focus-visible:ring-primary/50 transition-all rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</Label>
                {isLoginView && (
                  <button type="button" onClick={handleForgotPassword} className="text-xs font-semibold text-primary hover:underline">
                    Forgot your password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-12 bg-black/20 border-transparent focus-visible:ring-primary/50 transition-all rounded-xl"
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
              {!isLoginView && password.length > 0 && (
                <div className="w-full h-1.5 bg-black/20 rounded-full mt-2 overflow-hidden flex">
                  <div className={`h-full transition-all duration-300 ${pwColor}`} style={{ width: `${pwScore}%` }} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/20 bg-black/20 text-primary focus:ring-primary w-4 h-4"
              />
              <Label htmlFor="rememberMe" className="text-xs text-muted-foreground cursor-pointer">Remember Me</Label>
            </div>

            {!isLoginView && (
              <div className="flex items-start gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agreedToTerms} 
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="rounded border-white/20 bg-black/20 text-primary focus:ring-primary w-4 h-4 mt-0.5"
                />
                <Label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-tight">
                  By creating an account, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                </Label>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-sm p-3 rounded-xl flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{successMsg}</p>
              </div>
            )}

            <Button disabled={isLoading} type="submit" className="w-full h-12 rounded-xl text-md font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all mt-6 group">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLoginView ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-border/50"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase tracking-wider">or continue with</span>
              <div className="flex-grow border-t border-border/50"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                disabled={isLoading}
                onClick={() => handleSSOLogin('google')} 
                className="h-11 rounded-xl font-medium border-border/50 bg-transparent hover:bg-accent hover:text-foreground transition-all flex items-center gap-2"
              >
                <Chrome className="w-4 h-4" />
                Google
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                disabled={isLoading}
                onClick={() => handleSSOLogin('github')} 
                className="h-11 rounded-xl font-medium border-border/50 bg-transparent hover:bg-accent hover:text-foreground transition-all flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                GitHub
              </Button>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              disabled={isLoading}
              onClick={handleGuestLogin} 
              className="w-full h-11 mt-3 rounded-xl text-md font-medium border-border/50 bg-transparent hover:bg-accent hover:text-foreground transition-all"
            >
              Continue as Guest
            </Button>
          </form>
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {isLoginView ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLoginView(!isLoginView)}
              className="ml-2 font-semibold text-primary hover:underline"
            >
              {isLoginView ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
