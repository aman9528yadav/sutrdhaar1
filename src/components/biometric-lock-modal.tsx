"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Lock, KeyRound, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyBiometricAuth, hashPin, isBiometricsAvailable } from '@/lib/biometrics';

interface BiometricLockModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function BiometricLockModal({
  isOpen,
  title = "Authentication Required",
  description = "Verify your fingerprint or enter PIN to access this section.",
  onSuccess,
  onCancel
}: BiometricLockModalProps) {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isBiometricPrompting, setIsBiometricPrompting] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [hasPinConfigured, setHasPinConfigured] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      isBiometricsAvailable().then(setHasBiometrics);
      const savedPinHash = localStorage.getItem('sutra_security_pin_hash');
      setHasPinConfigured(Boolean(savedPinHash));
    }
  }, [isOpen]);

  // Automatically trigger fingerprint prompt when modal opens
  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg('');
      handleTriggerBiometrics();
    }
  }, [isOpen]);

  const handleTriggerBiometrics = async () => {
    setIsBiometricPrompting(true);
    setErrorMsg('');
    const verified = await verifyBiometricAuth();
    setIsBiometricPrompting(false);

    if (verified) {
      onSuccess();
    } else {
      // If user cancelled or failed, let them enter PIN or retry
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const savedPinHash = localStorage.getItem('sutra_security_pin_hash');
    if (!savedPinHash) {
      // No PIN configured yet, treat default or allow
      onSuccess();
      return;
    }

    if (pinInput.length < 4) {
      setErrorMsg('Please enter a 4-digit PIN');
      return;
    }

    const enteredHash = await hashPin(pinInput);
    if (enteredHash === savedPinHash) {
      onSuccess();
    } else {
      setErrorMsg('Incorrect PIN. Please try again.');
      setPinInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-200">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-sm rounded-[2.5rem] p-7 bg-card border border-border/60 shadow-2xl space-y-6 relative overflow-hidden"
        >
          {onCancel && (
            <button 
              onClick={onCancel}
              className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Icon Header */}
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10">
                <Fingerprint className="w-10 h-10 text-indigo-400 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shadow-md">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground tracking-tight">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
                {description}
              </p>
            </div>
          </div>

          {/* Quick Biometrics Button */}
          {hasBiometrics && (
            <Button
              type="button"
              onClick={handleTriggerBiometrics}
              disabled={isBiometricPrompting}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 gap-2.5 transition-all"
            >
              <Fingerprint className="w-5 h-5" />
              <span>{isBiometricPrompting ? 'Scanning Fingerprint...' : 'Scan Fingerprint / Face'}</span>
            </Button>
          )}

          {/* PIN Alternative Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-border/40 w-full" />
            <span className="bg-card px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
              {hasBiometrics ? 'Or enter PIN' : 'Enter 4-Digit PIN'}
            </span>
            <div className="border-t border-border/40 w-full" />
          </div>

          {/* PIN Form */}
          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div className="space-y-1.5">
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Enter 4-digit PIN"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`pl-10 h-11 text-center font-mono text-base tracking-widest bg-background/50 border rounded-2xl ${
                    errorMsg ? 'border-red-500 ring-1 ring-red-500/50' : 'border-border/60'
                  }`}
                  autoFocus={!hasBiometrics}
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs font-semibold pl-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 h-11 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!pinInput.trim()}
                className="flex-1 h-11 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-md"
              >
                Unlock
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
