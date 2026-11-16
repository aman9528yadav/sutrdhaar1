"use client";

import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  QrCode, 
  Download, 
  Copy, 
  Share2, 
  Sparkles, 
  Link, 
  Wifi, 
  CreditCard, 
  Phone, 
  Mail, 
  FileText,
  Check,
  Palette
} from 'lucide-react';

type QRType = 'link' | 'upi' | 'wifi' | 'text' | 'contact';

export function QrCodeTool() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [qrType, setQrType] = useState<QRType>('link');
  const [dataText, setDataText] = useState('https://sutradhaar.app');
  
  // UPI specific
  const [upiVpa, setUpiVpa] = useState('');
  const [upiName, setUpiName] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  
  // WiFi specific
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // Styling
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [isCopied, setIsCopied] = useState(false);

  // Compute raw payload based on type
  const getPayload = () => {
    switch (qrType) {
      case 'link':
      case 'text':
        return dataText || ' ';
      case 'upi': {
        if (!upiVpa) return 'upi://pay';
        let url = `upi://pay?pa=${encodeURIComponent(upiVpa)}`;
        if (upiName) url += `&pn=${encodeURIComponent(upiName)}`;
        if (upiAmount) url += `&am=${encodeURIComponent(upiAmount)}`;
        url += `&cu=INR`;
        return url;
      }
      case 'wifi':
        return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
      case 'contact':
        return `TEL:${dataText}`;
      default:
        return dataText || ' ';
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const payload = getPayload();
    
    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: 280,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: 'H',
      },
      (error) => {
        if (error) console.error('QR code generation error:', error);
      }
    );
  }, [qrType, dataText, upiVpa, upiName, upiAmount, wifiSsid, wifiPassword, wifiEncryption, fgColor, bgColor]);

  const handleDownload = (format: 'png' | 'svg') => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `sutradhaar-qr-${Date.now()}.${format}`;
    a.click();
    toast({ title: "Downloaded!", description: "QR Code saved to your device." });
  };

  const handleCopyLink = async () => {
    const payload = getPayload();
    try {
      await navigator.clipboard.writeText(payload);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({ title: "Copied!", description: "QR payload copied to clipboard." });
    } catch {
      toast({ title: "Copy Failed", variant: "destructive" });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-4 pb-20 pt-2">
      {/* Type Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'link', label: 'URL Link', icon: Link },
          { id: 'upi', label: 'UPI / Pay', icon: CreditCard },
          { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
          { id: 'text', label: 'Plain Text', icon: FileText },
          { id: 'contact', label: 'Phone', icon: Phone },
        ].map(item => {
          const Icon = item.icon;
          const isActive = qrType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setQrType(item.id as QRType)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive 
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                  : 'bg-card text-muted-foreground border-border/50 hover:bg-muted'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main QR Preview Card */}
      <Card className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg flex flex-col items-center justify-center space-y-4">
        <div className="p-3 bg-white rounded-2xl shadow-inner border border-border/40 inline-block">
          <canvas ref={canvasRef} className="rounded-xl w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]" />
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 w-full max-w-xs justify-center">
          <Button
            size="sm"
            onClick={() => handleDownload('png')}
            className="flex-1 h-9 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Download PNG
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="h-9 px-3 rounded-xl font-semibold text-xs border-border/60 hover:bg-muted gap-1"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy Data'}</span>
          </Button>
        </div>
      </Card>

      {/* Input Options Card */}
      <Card className="p-5 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-md space-y-4">
        {qrType === 'link' && (
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Website URL</Label>
            <Input
              placeholder="https://example.com"
              value={dataText}
              onChange={e => setDataText(e.target.value)}
              className="h-11 rounded-xl text-xs bg-background/50 border-border/50"
            />
          </div>
        )}

        {qrType === 'upi' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">UPI ID (VPA)</Label>
              <Input
                placeholder="name@upi or 9876543210@paytm"
                value={upiVpa}
                onChange={e => setUpiVpa(e.target.value)}
                className="h-11 rounded-xl text-xs bg-background/50 border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payee Name</Label>
                <Input
                  placeholder="Business / Name"
                  value={upiName}
                  onChange={e => setUpiName(e.target.value)}
                  className="h-10 rounded-xl text-xs bg-background/50 border-border/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={upiAmount}
                  onChange={e => setUpiAmount(e.target.value)}
                  className="h-10 rounded-xl text-xs bg-background/50 border-border/50"
                />
              </div>
            </div>
          </div>
        )}

        {qrType === 'wifi' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Network Name (SSID)</Label>
              <Input
                placeholder="Home Wi-Fi"
                value={wifiSsid}
                onChange={e => setWifiSsid(e.target.value)}
                className="h-11 rounded-xl text-xs bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input
                type="password"
                placeholder="Wi-Fi Password"
                value={wifiPassword}
                onChange={e => setWifiPassword(e.target.value)}
                className="h-11 rounded-xl text-xs bg-background/50 border-border/50"
              />
            </div>
          </div>
        )}

        {qrType === 'text' && (
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Text Message</Label>
            <Textarea
              rows={3}
              placeholder="Enter text or notes to encode..."
              value={dataText}
              onChange={e => setDataText(e.target.value)}
              className="rounded-xl text-xs bg-background/50 border-border/50"
            />
          </div>
        )}

        {qrType === 'contact' && (
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
            <Input
              placeholder="+91 98765 43210"
              value={dataText}
              onChange={e => setDataText(e.target.value)}
              className="h-11 rounded-xl text-xs bg-background/50 border-border/50"
            />
          </div>
        )}

        {/* Color Customizer */}
        <div className="pt-2 border-t border-border/40">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2.5">
            <Palette className="w-3.5 h-3.5 text-primary" /> QR Colors
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-background/50 p-2 rounded-xl border border-border/40">
              <input
                type="color"
                value={fgColor}
                onChange={e => setFgColor(e.target.value)}
                className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-medium text-foreground">Pattern Color</span>
            </div>
            <div className="flex items-center gap-2 bg-background/50 p-2 rounded-xl border border-border/40">
              <input
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-medium text-foreground">Background</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
