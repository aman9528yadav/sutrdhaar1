"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy,
    RefreshCw,
    Check,
    Shield,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    AlertTriangle,
    Heart,
    Trash2,
    BookmarkPlus,
    BookmarkCheck,
    Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/context/ProfileContext';
import { hasUnlockedFeature } from '@/lib/level-system';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function PasswordGenerator() {
    const { toast } = useToast();
    const { addXP, profile } = useProfile();
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState(0);
    const [savedPasswords, setSavedPasswords] = useState<Array<{
        id: string;
        password: string;
        label: string;
        strength: number;
        createdAt: string;
    }>>([]);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [passwordLabel, setPasswordLabel] = useState('');
    const [showSaved, setShowSaved] = useState(false);

    const generatePassword = () => {
        let chars = '';
        let passwordChars: string[] = [];

        if (includeUppercase) {
            chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            passwordChars.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]);
        }
        if (includeLowercase) {
            chars += 'abcdefghijklmnopqrstuvwxyz';
            passwordChars.push('abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]);
        }
        if (includeNumbers) {
            chars += '0123456789';
            passwordChars.push('0123456789'[Math.floor(Math.random() * 10)]);
        }
        if (includeSymbols) {
            chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
            passwordChars.push('!@#$%^&*()_+-=[]{}|;:,.<>?'[Math.floor(Math.random() * 24)]);
        }

        if (chars === '') {
            toast({
                title: "Error",
                description: "Please select at least one character type",
                variant: "destructive",
            });
            return;
        }

        for (let i = passwordChars.length; i < length; i++) {
            passwordChars.push(chars[Math.floor(Math.random() * chars.length)]);
        }

        passwordChars = passwordChars.sort(() => Math.random() - 0.5);
        setPassword(passwordChars.join(''));
        setCopied(false);
        addXP(1, 'Generated a secure password');
    };

    const calculateStrength = () => {
        let score = 0;
        
        if (length >= 8) score += 20;
        if (length >= 12) score += 15;
        if (length >= 16) score += 15;
        if (length >= 20) score += 10;
        
        if (includeUppercase) score += 10;
        if (includeLowercase) score += 10;
        if (includeNumbers) score += 10;
        if (includeSymbols) score += 10;

        setStrength(Math.min(score, 100));
    };

    useEffect(() => {
        calculateStrength();
    }, [password, length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

    useEffect(() => {
        generatePassword();
        // Load saved passwords from localStorage
        const saved = localStorage.getItem('savedPasswords');
        if (saved) {
            setSavedPasswords(JSON.parse(saved));
        }
    }, []);

    const copyToClipboard = async () => {
        if (!password) return;
        
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            toast({
                title: "Copied!",
                description: "Password copied to clipboard",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to copy password",
                variant: "destructive",
            });
        }
    };

    const savePassword = () => {
        if (!password) return;
        setIsSaveDialogOpen(true);
    };

    const confirmSavePassword = () => {
        const newSaved = {
            id: Date.now().toString(),
            password: password,
            label: passwordLabel || `Password ${savedPasswords.length + 1}`,
            strength: strength,
            createdAt: new Date().toISOString(),
        };

        const updated = [newSaved, ...savedPasswords];
        setSavedPasswords(updated);
        localStorage.setItem('savedPasswords', JSON.stringify(updated));
        
        setPasswordLabel('');
        setIsSaveDialogOpen(false);
        
        toast({
            title: "Saved!",
            description: "Password saved successfully",
        });
    };

    const deleteSavedPassword = (id: string) => {
        const updated = savedPasswords.filter(p => p.id !== id);
        setSavedPasswords(updated);
        localStorage.setItem('savedPasswords', JSON.stringify(updated));
        
        toast({
            title: "Deleted",
            description: "Password removed from saved list",
        });
    };

    const copySavedPassword = async (password: string) => {
        try {
            await navigator.clipboard.writeText(password);
            toast({
                title: "Copied!",
                description: "Password copied to clipboard",
            });
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to copy password",
                variant: "destructive",
            });
        }
    };

    const getStrengthLabel = (strengthValue?: number) => {
        const value = strengthValue ?? strength;
        if (value >= 90) return { label: 'Very Strong', color: 'text-green-500', bg: 'bg-green-500' };
        if (value >= 70) return { label: 'Strong', color: 'text-emerald-500', bg: 'bg-emerald-500' };
        if (value >= 50) return { label: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500' };
        if (value >= 30) return { label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500' };
        return { label: 'Very Weak', color: 'text-red-500', bg: 'bg-red-500' };
    };

    const strengthInfo = getStrengthLabel();

    const isUnlocked = hasUnlockedFeature(profile, 'password_gen');

    if (!isUnlocked) {
        return (
            <div className="space-y-4 pb-24 px-4 pt-4">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                    Password Generator
                </h1>
                <Card className="border-border/50 bg-card/50">
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                            <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold">Feature Locked</h2>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            You need to reach Level 2 to unlock the Password Generator. Keep using other tools to earn XP!
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-24">
            <div className="px-4 pt-4">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                    Password Generator
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Create strong, secure passwords</p>
            </div>

            <div className="px-4 space-y-4">
                {/* Password Display */}
                <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="flex items-center gap-2">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        readOnly
                                        className="font-mono text-lg pr-24 h-14"
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-16 top-1/2 -translate-y-1/2"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="icon"
                                        onClick={copyToClipboard}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Strength Indicator */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Password Strength</Label>
                                    <Badge variant="outline" className={strengthInfo.color}>
                                        {strengthInfo.label}
                                    </Badge>
                                </div>
                                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        className={`h-full ${strengthInfo.bg}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${strength}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Generate Button */}
                <Button
                    onClick={generatePassword}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-12"
                >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Generate Password
                </Button>

                {/* Save Password Button */}
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        onClick={savePassword}
                        variant="outline"
                        className="h-12 border-blue-500/30 hover:bg-blue-500/10"
                    >
                        <BookmarkPlus className="mr-2 h-5 w-5 text-blue-500" />
                        Save This
                    </Button>
                    <Button
                        onClick={() => setShowSaved(!showSaved)}
                        variant="outline"
                        className="h-12 border-purple-500/30 hover:bg-purple-500/10"
                    >
                        <BookmarkCheck className="mr-2 h-5 w-5 text-purple-500" />
                        Saved ({savedPasswords.length})
                    </Button>
                </div>

                {/* Length Slider */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Password Length</CardTitle>
                        <CardDescription>{length} characters</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Slider
                            value={[length]}
                            onValueChange={(value) => setLength(value[0])}
                            min={4}
                            max={64}
                            step={1}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>4</span>
                            <span>64</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Character Options */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Character Types</CardTitle>
                        <CardDescription>Include different character types</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Lock className="h-4 w-4 text-blue-500" />
                                </div>
                                <div>
                                    <Label className="font-medium">Uppercase (A-Z)</Label>
                                    <p className="text-xs text-muted-foreground">Include uppercase letters</p>
                                </div>
                            </div>
                            <Switch
                                checked={includeUppercase}
                                onCheckedChange={setIncludeUppercase}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <Unlock className="h-4 w-4 text-green-500" />
                                </div>
                                <div>
                                    <Label className="font-medium">Lowercase (a-z)</Label>
                                    <p className="text-xs text-muted-foreground">Include lowercase letters</p>
                                </div>
                            </div>
                            <Switch
                                checked={includeLowercase}
                                onCheckedChange={setIncludeLowercase}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <Shield className="h-4 w-4 text-orange-500" />
                                </div>
                                <div>
                                    <Label className="font-medium">Numbers (0-9)</Label>
                                    <p className="text-xs text-muted-foreground">Include numeric digits</p>
                                </div>
                            </div>
                            <Switch
                                checked={includeNumbers}
                                onCheckedChange={setIncludeNumbers}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <AlertTriangle className="h-4 w-4 text-purple-500" />
                                </div>
                                <div>
                                    <Label className="font-medium">Symbols (!@#$)</Label>
                                    <p className="text-xs text-muted-foreground">Include special characters</p>
                                </div>
                            </div>
                            <Switch
                                checked={includeSymbols}
                                onCheckedChange={setIncludeSymbols}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Presets */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Quick Presets</CardTitle>
                        <CardDescription>Common password configurations</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setLength(8);
                                setIncludeUppercase(true);
                                setIncludeLowercase(true);
                                setIncludeNumbers(true);
                                setIncludeSymbols(false);
                                setTimeout(generatePassword, 0);
                            }}
                        >
                            Simple (8)
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setLength(12);
                                setIncludeUppercase(true);
                                setIncludeLowercase(true);
                                setIncludeNumbers(true);
                                setIncludeSymbols(true);
                                setTimeout(generatePassword, 0);
                            }}
                        >
                            Standard (12)
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setLength(16);
                                setIncludeUppercase(true);
                                setIncludeLowercase(true);
                                setIncludeNumbers(true);
                                setIncludeSymbols(true);
                                setTimeout(generatePassword, 0);
                            }}
                        >
                            Strong (16)
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setLength(24);
                                setIncludeUppercase(true);
                                setIncludeLowercase(true);
                                setIncludeNumbers(true);
                                setIncludeSymbols(true);
                                setTimeout(generatePassword, 0);
                            }}
                        >
                            Maximum (24)
                        </Button>
                    </CardContent>
                </Card>

                {/* Security Tips */}
                <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-amber-500" />
                            Security Tips
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">• Use at least 12 characters</p>
                        <p className="text-sm text-muted-foreground">• Mix uppercase, lowercase, numbers & symbols</p>
                        <p className="text-sm text-muted-foreground">• Avoid using personal information</p>
                        <p className="text-sm text-muted-foreground">• Use unique passwords for each account</p>
                        <p className="text-sm text-muted-foreground">• Consider using a password manager</p>
                    </CardContent>
                </Card>

                {/* Saved Passwords */}
                <AnimatePresence>
                    {showSaved && savedPasswords.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <BookmarkCheck className="h-5 w-5 text-green-500" />
                                        Saved Passwords
                                    </CardTitle>
                                    <CardDescription>Your favorite passwords</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {savedPasswords.map((saved) => {
                                        const savedStrength = getStrengthLabel(saved.strength);
                                        return (
                                            <div
                                                key={saved.id}
                                                className="p-4 rounded-lg bg-card/50 border border-white/5 space-y-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <p className="font-medium text-sm truncate">{saved.label}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8"
                                                            onClick={() => copySavedPassword(saved.password)}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => deleteSavedPassword(saved.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 font-mono text-xs bg-muted px-2 py-1 rounded truncate block">
                                                        {saved.password}
                                                    </code>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <Badge variant="outline" className={savedStrength.color}>
                                                        {savedStrength.label}
                                                    </Badge>
                                                    <span className="text-muted-foreground">
                                                        {new Date(saved.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Save Password Dialog */}
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Password</DialogTitle>
                        <DialogDescription>
                            Add a label to help you remember this password
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Label (optional)</Label>
                            <Input
                                value={passwordLabel}
                                onChange={(e) => setPasswordLabel(e.target.value)}
                                placeholder="e.g., Gmail, Facebook, etc."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <code className="block p-3 bg-muted rounded-lg text-sm font-mono break-all">
                                {password}
                            </code>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsSaveDialogOpen(false);
                                setPasswordLabel('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={confirmSavePassword}>
                            <BookmarkPlus className="mr-2 h-4 w-4" />
                            Save Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
