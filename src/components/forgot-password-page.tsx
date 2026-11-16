"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const { sendPasswordReset } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setComplete(true);
    } catch (err: any) {
      console.error('error', err);
    } finally {
      setLoading(false);
    }
  }

  if (complete) {
    return (
      <div className="flex flex-col items-center w-full max-w-md mx-auto relative z-10">
        <Card className="w-full bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-green-500/20 rounded-full mb-6 backdrop-blur-md border border-green-500/30">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Sent</h2>
            <p className="text-white/60 mb-8">We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.</p>
            <Button asChild className="w-full bg-white text-black hover:bg-white/90 rounded-xl h-11 font-medium">
              <Link href="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto relative z-10">
      <Card className="w-full bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-4 backdrop-blur-md border border-white/10">
              <Mail className="h-6 w-6 text-blue-300" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Forgot Password?</h2>
            <p className="text-sm text-white/60 mt-2">
              No problem. Enter your email below and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="bg-black/20 border-white/10 text-white placeholder:text-white/30 rounded-xl h-12 focus-visible:ring-offset-0 focus-visible:ring-white/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gap-2 bg-white text-black hover:bg-white/90 rounded-xl px-6 h-11 font-medium">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send Reset Link
            </Button>
          </form>
        </CardContent>
      </Card>
      <Button asChild variant="ghost" className="mt-8 text-white/60 hover:text-white hover:bg-white/10 rounded-full px-6">
        <Link href="/login">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Link>
      </Button>
    </div>
  );
}
