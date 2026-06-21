
"use client";

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function ResendVerification({ email, onResend }: { email: string, onResend: () => Promise<void> }) {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleResend = async () => {
    setIsSending(true);
    try {
      await onResend();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Could not resend verification email.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Alert variant="destructive" className="flex items-center justify-between">
      <AlertDescription className="text-xs">
        Your email is not verified.
      </AlertDescription>
       <Button
        variant="link"
        size="sm"
        className="p-0 h-auto text-xs text-destructive-foreground"
        onClick={handleResend}
        disabled={isSending}
      >
        {isSending ? 'Sending...' : 'Resend Email'}
      </Button>
    </Alert>
  );
}
