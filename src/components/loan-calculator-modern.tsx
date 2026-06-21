"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calculator, DollarSign, Percent, Calendar, RefreshCcw, Download, 
  Home, Car, CreditCard, Briefcase, Target, TrendingUp, 
  FileText, Share2, Zap, Shield, Award, Globe,
  IndianRupee, Building2, Users, Lightbulb, Clock,
  Save, BookmarkPlus, BookmarkCheck, Trash2, Eye,
  GitCompareArrows as CompareArrows, TrendingDown, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export function LoanCalculatorModern() {
    const { toast } = useToast();
    const [amount, setAmount] = useState<number>(500000);
    const [rate, setRate] = useState<number>(8.5);
    const [tenure, setTenure] = useState<number>(5);
    const [tenureType, setTenureType] = useState<'years' | 'months'>('years');
    const [loanType, setLoanType] = useState<'home' | 'car' | 'personal' | 'business'>('home');
    const [processingFee, setProcessingFee] = useState<number>(1);
    const [prepaymentAllowed, setPrepaymentAllowed] = useState<boolean>(true);
    const [prepaymentPenalty, setPrepaymentPenalty] = useState<number>(2);
    const [downPayment, setDownPayment] = useState<number>(0);
    const [prepaymentAmount, setPrepaymentAmount] = useState<number>(0);
    const [prepaymentMonth, setPrepaymentMonth] = useState<number>(12);

    const [emi, setEmi] = useState<number>(0);
    const [totalInterest, setTotalInterest] = useState<number>(0);
    const [totalPayment, setTotalPayment] = useState<number>(0);
    const [processingFeeAmount, setProcessingFeeAmount] = useState<number>(0);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [yearlySummary, setYearlySummary] = useState<any[]>([]);
    
    // New calculated fields
    const [emiWithPrepayment, setEmiWithPrepayment] = useState<number>(0);
    const [interestSaved, setInterestSaved] = useState<number>(0);
    const [tenureReduced, setTenureReduced] = useState<number>(0);
    
    // Saved comparisons
    const [savedComparisons, setSavedComparisons] = useState<Array<{
        id: string;
        label: string;
        amount: number;
        rate: number;
        tenure: number;
        emi: number;
        totalInterest: number;
        totalPayment: number;
        createdAt: string;
    }>>([]);
    const [showSavedComparisons, setShowSavedComparisons] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [comparisonLabel, setComparisonLabel] = useState('');
    const [showComparison, setShowComparison] = useState(false);
    const [previousComparison, setPreviousComparison] = useState<any>(null);

    // Loan type configurations
    const loanConfigurations = {
        home: { min: 100000, max: 50000000, defaultRate: 8.5, icon: Home, color: 'from-blue-500/20 to-indigo-500/20' },
        car: { min: 50000, max: 5000000, defaultRate: 9.0, icon: Car, color: 'from-emerald-500/20 to-teal-500/20' },
        personal: { min: 10000, max: 2000000, defaultRate: 12.0, icon: Users, color: 'from-purple-500/20 to-pink-500/20' },
        business: { min: 100000, max: 10000000, defaultRate: 14.0, icon: Briefcase, color: 'from-amber-500/20 to-orange-500/20' }
    };

    const calculateLoan = () => {
        const principal = amount - downPayment;
        const monthlyRate = rate / 12 / 100;
        const months = tenureType === 'years' ? tenure * 12 : tenure;
        const feeAmount = (amount * processingFee) / 100;

        if (principal > 0 && rate > 0 && months > 0) {
            const emiValue = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
            const totalPay = emiValue * months;
            const totalInt = totalPay - principal;

            setEmi(Math.round(emiValue));
            setTotalPayment(Math.round(totalPay));
            setTotalInterest(Math.round(totalInt));
            setProcessingFeeAmount(Math.round(feeAmount));

            // Generate Detailed Amortization Schedule with Prepayment
            let balance = principal;
            const newSchedule = [];
            const yearlyData = [];
            let actualMonths = months;

            for (let i = 1; i <= months; i++) {
                const interest = balance * monthlyRate;
                let principalComponent = emiValue - interest;
                let extraPayment = 0;
                
                // Apply prepayment if specified
                if (i === prepaymentMonth && prepaymentAmount > 0) {
                    extraPayment = prepaymentAmount;
                    balance -= extraPayment;
                }
                
                const prevBalance = balance;
                balance -= principalComponent;
                
                if (balance <= 0) {
                    actualMonths = i;
                    newSchedule.push({
                        month: i,
                        emi: Math.round(emiValue + extraPayment),
                        principal: Math.round(principalComponent + extraPayment),
                        interest: Math.round(interest),
                        balance: 0,
                        totalPaid: Math.round(emiValue * i + extraPayment),
                        isPrepayment: extraPayment > 0
                    });
                    break;
                }

                newSchedule.push({
                    month: i,
                    emi: Math.round(emiValue + extraPayment),
                    principal: Math.round(principalComponent + extraPayment),
                    interest: Math.round(interest),
                    balance: Math.max(0, Math.round(balance)),
                    totalPaid: Math.round(emiValue * i + extraPayment),
                    isPrepayment: extraPayment > 0
                });

                // Yearly summary
                if (i % 12 === 0 || i === months) {
                    const year = Math.ceil(i / 12);
                    const yearPrincipal = newSchedule
                        .slice((year - 1) * 12, i)
                        .reduce((sum, entry) => sum + entry.principal, 0);
                    const yearInterest = newSchedule
                        .slice((year - 1) * 12, i)
                        .reduce((sum, entry) => sum + entry.interest, 0);

                    yearlyData.push({
                        year: year,
                        principal: Math.round(yearPrincipal),
                        interest: Math.round(yearInterest),
                        balance: Math.max(0, Math.round(balance))
                    });
                }
            }

            setSchedule(newSchedule);
            setYearlySummary(yearlyData);
            
            // Calculate prepayment benefits
            const monthsSaved = months - actualMonths;
            const interestWithPrepayment = newSchedule.reduce((sum, entry) => sum + entry.interest, 0);
            setEmiWithPrepayment(Math.round(emiValue));
            setInterestSaved(Math.round(totalInt - interestWithPrepayment));
            setTenureReduced(Math.round(monthsSaved / 30.44));
        }
    };

    useEffect(() => {
        calculateLoan();
    }, [amount, rate, tenure, tenureType, processingFee, downPayment, prepaymentAmount, prepaymentMonth]);

    useEffect(() => {
        // Load saved comparisons from localStorage
        const saved = localStorage.getItem('savedLoanComparisons');
        if (saved) {
            setSavedComparisons(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        // Update default rate when loan type changes
        setRate(loanConfigurations[loanType].defaultRate);
    }, [loanType]);

    const chartData = [
        { name: 'Principal', value: amount, color: '#10b981' },
        { name: 'Interest', value: totalInterest, color: '#f43f5e' },
        { name: 'Processing Fee', value: processingFeeAmount, color: '#8b5cf6' }
    ];

    const yearlyChartData = yearlySummary.map(item => ({
        name: `Year ${item.year}`,
        Principal: item.principal,
        Interest: item.interest
    }));

    const getLoanTypeInfo = () => {
        const config = loanConfigurations[loanType];
        const Icon = config.icon;
        return { icon: Icon, color: config.color };
    };

    const exportSchedule = () => {
        const csvContent = [
            ['Month', 'EMI', 'Principal', 'Interest', 'Balance', 'Total Paid'],
            ...schedule.map(row => [
                row.month,
                row.emi,
                row.principal,
                row.interest,
                row.balance,
                row.totalPaid
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loan-amortization-${loanType}.csv`;
        a.click();
    };

    const shareResults = async () => {
        const text = `💰 ${loanType.charAt(0).toUpperCase() + loanType.slice(1)} Loan EMI Calculator Results
        
Loan Amount: ₹${amount.toLocaleString()}
Down Payment: ₹${downPayment.toLocaleString()}
Interest Rate: ${rate}%
Tenure: ${tenure} ${tenureType}
Monthly EMI: ₹${emi.toLocaleString()}
Total Interest: ₹${totalInterest.toLocaleString()}
Total Payment: ₹${totalPayment.toLocaleString()}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Loan EMI Calculator Results',
                    text: text
                });
            } catch (err) {
                console.log('Share failed:', err);
            }
        } else {
            navigator.clipboard.writeText(text);
            toast({
                title: "Copied!",
                description: "Results copied to clipboard",
            });
        }
    };

    const saveComparison = () => {
        setIsSaveDialogOpen(true);
    };

    const confirmSaveComparison = () => {
        const newComparison = {
            id: Date.now().toString(),
            label: comparisonLabel || `Comparison ${savedComparisons.length + 1}`,
            amount: amount,
            rate: rate,
            tenure: tenure,
            emi: emi,
            totalInterest: totalInterest,
            totalPayment: totalPayment,
            createdAt: new Date().toISOString(),
        };

        const updated = [newComparison, ...savedComparisons];
        setSavedComparisons(updated);
        localStorage.setItem('savedLoanComparisons', JSON.stringify(updated));
        
        setComparisonLabel('');
        setIsSaveDialogOpen(false);
        
        toast({
            title: "Saved!",
            description: "Loan comparison saved successfully",
        });
    };

    const deleteComparison = (id: string) => {
        const updated = savedComparisons.filter(c => c.id !== id);
        setSavedComparisons(updated);
        localStorage.setItem('savedLoanComparisons', JSON.stringify(updated));
        
        toast({
            title: "Deleted",
            description: "Comparison removed from saved list",
        });
    };

    const loadComparison = (comparison: any) => {
        setPreviousComparison({ amount, rate, tenure, emi, totalInterest, totalPayment });
        setAmount(comparison.amount);
        setRate(comparison.rate);
        setTenure(comparison.tenure);
        setShowComparison(true);
        
        toast({
            title: "Loaded!",
            description: "Comparison loaded - adjust to see differences",
        });
    };

    const { icon: LoanIcon, color: gradientColor } = getLoanTypeInfo();

    return (
        <div className="space-y-6 h-full flex flex-col pb-20 max-w-3xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                        Loan Calculator
                    </h1>
                    <p className="text-muted-foreground mt-1">Calculate your loan payments</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={saveComparison}>
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                        Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowSavedComparisons(!showSavedComparisons)}>
                        <BookmarkCheck className="h-4 w-4 mr-2" />
                        Saved ({savedComparisons.length})
                    </Button>
                    <Button variant="outline" size="sm" onClick={shareResults}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportSchedule}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Input Section */}
                <div className="space-y-6">
                    {/* Loan Type Selection */}
                    <Card className="bg-card/50 border-border/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Loan Type
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(loanConfigurations).map(([type, config]) => {
                                    const Icon = config.icon;
                                    return (
                                        <Button
                                            key={type}
                                            variant={loanType === type ? "default" : "outline"}
                                            className={cn(
                                                "h-16 flex flex-col gap-1",
                                                loanType === type && "bg-primary hover:bg-primary/90"
                                            )}
                                            onClick={() => setLoanType(type as any)}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="text-xs capitalize">{type}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Loan Details */}
                    <Card className="bg-card/50 border-border/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-foreground">Loan Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-foreground">Loan Amount</Label>
                                    <span className="text-primary font-mono font-bold">₹{amount.toLocaleString()}</span>
                                </div>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="pl-9 bg-card/50 border-border/50 text-foreground"
                                    />
                                </div>
                                <Slider
                                    value={[amount]}
                                    min={loanConfigurations[loanType].min}
                                    max={loanConfigurations[loanType].max}
                                    step={10000}
                                    onValueChange={([v]) => setAmount(v)}
                                    className="py-2"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-foreground">Down Payment (Optional)</Label>
                                    <span className="text-emerald-400 font-mono font-bold">₹{downPayment.toLocaleString()}</span>
                                </div>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={downPayment}
                                        onChange={(e) => setDownPayment(Number(e.target.value))}
                                        className="pl-9 bg-card/50 border-border/50 text-foreground"
                                    />
                                </div>
                                <Slider
                                    value={[downPayment]}
                                    min={0}
                                    max={amount * 0.5}
                                    step={10000}
                                    onValueChange={([v]) => setDownPayment(v)}
                                    className="py-2"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-foreground">Interest Rate (%)</Label>
                                    <span className="text-primary font-mono font-bold">{rate}%</span>
                                </div>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={rate}
                                        onChange={(e) => setRate(Number(e.target.value))}
                                        className="pl-9 bg-card/50 border-border/50 text-foreground"
                                    />
                                </div>
                                <Slider
                                    value={[rate]}
                                    min={6}
                                    max={25}
                                    step={0.1}
                                    onValueChange={([v]) => setRate(v)}
                                    className="py-2"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-foreground">Loan Tenure</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={tenureType === 'years' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setTenureType('years')}
                                            className="h-6 text-xs"
                                        >
                                            Years
                                        </Button>
                                        <Button
                                            variant={tenureType === 'months' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setTenureType('months')}
                                            className="h-6 text-xs"
                                        >
                                            Months
                                        </Button>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={tenure}
                                        onChange={(e) => setTenure(Number(e.target.value))}
                                        className="pl-9 bg-card/50 border-border/50 text-foreground"
                                    />
                                </div>
                                <Slider
                                    value={[tenure]}
                                    min={1}
                                    max={tenureType === 'years' ? 30 : 360}
                                    step={1}
                                    onValueChange={([v]) => setTenure(v)}
                                    className="py-2"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-foreground">Processing Fee (%)</Label>
                                    <span className="text-primary font-mono font-bold">{processingFee}%</span>
                                </div>
                                <Slider
                                    value={[processingFee]}
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    onValueChange={([v]) => setProcessingFee(v)}
                                    className="py-2"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Advanced Options */}
                    <Card className="bg-card/50 border-border/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-foreground text-sm flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Prepayment Options
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <Label className="text-foreground text-sm">Prepayment Amount (₹)</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={prepaymentAmount}
                                        onChange={(e) => setPrepaymentAmount(Number(e.target.value))}
                                        className="pl-9 bg-card/50 border-border/50 text-foreground"
                                        placeholder="Enter prepayment amount"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <Label className="text-foreground text-sm">Prepayment After (Months)</Label>
                                <Input
                                    type="number"
                                    value={prepaymentMonth}
                                    onChange={(e) => setPrepaymentMonth(Number(e.target.value))}
                                    className="bg-card/50 border-border/50 text-foreground"
                                />
                                <div className="text-xs text-muted-foreground">
                                    Prepayment will be applied after {prepaymentMonth} months
                                </div>
                            </div>

                            {interestSaved > 0 && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingDown className="h-4 w-4 text-emerald-400" />
                                        <span className="text-sm font-medium text-emerald-400">Benefits of Prepayment</span>
                                    </div>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Interest Saved:</span>
                                            <span className="font-bold text-emerald-400">₹{interestSaved.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tenure Reduced:</span>
                                            <span className="font-bold text-emerald-400">{tenureReduced} years</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/30">
                            <CardContent className="p-4 text-center">
                                <DollarSign className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly EMI</p>
                                <p className="text-2xl font-bold text-emerald-500 mt-1">₹{emi.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-rose-500/20 to-red-500/20 border-rose-500/30">
                            <CardContent className="p-4 text-center">
                                <TrendingUp className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Interest</p>
                                <p className="text-2xl font-bold text-rose-500 mt-1">₹{totalInterest.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30">
                            <CardContent className="p-4 text-center">
                                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Payment</p>
                                <p className="text-2xl font-bold text-blue-500 mt-1">₹{totalPayment.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Breakdown */}
                    <Card className="bg-card/50 border-border/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Payment Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-card/50 rounded-lg">
                                        <span className="text-muted-foreground">Principal Amount</span>
                                        <span className="font-bold text-foreground">₹{amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-card/50 rounded-lg">
                                        <span className="text-muted-foreground">Total Interest</span>
                                        <span className="font-bold text-rose-400">₹{totalInterest.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-card/50 rounded-lg">
                                        <span className="text-muted-foreground">Processing Fee</span>
                                        <span className="font-bold text-purple-400">₹{processingFeeAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-primary/30">
                                        <span className="text-foreground font-medium">Total Payment</span>
                                        <span className="font-bold text-primary text-xl">₹{(totalPayment + processingFeeAmount).toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ 
                                                    backgroundColor: '#1e293b', 
                                                    borderColor: '#334155', 
                                                    color: '#fff',
                                                    borderRadius: '8px'
                                                }}
                                                formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                                            />
                                            <Legend 
                                                verticalAlign="bottom" 
                                                height={36} 
                                                iconType="circle"
                                                formatter={(value) => <span className="text-foreground text-xs">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Yearly Analysis */}
                    <Card className="bg-card/50 border-border/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <BarChart className="h-5 w-5" />
                                Yearly Payment Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yearlyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#94a3b8" 
                                        fontSize={12}
                                    />
                                    <YAxis 
                                        stroke="#94a3b8" 
                                        fontSize={12}
                                        tickFormatter={(value) => `₹${(value/100000).toFixed(0)}L`}
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: '#1e293b', 
                                            borderColor: '#334155', 
                                            color: '#fff',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                                    />
                                    <Legend 
                                        formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                                    />
                                    <Bar dataKey="Principal" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Interest" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Amortization Schedule */}
                    <Card className="bg-card/50 border-border/50 backdrop-blur-xl">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-foreground">Amortization Schedule</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        Detailed month-by-month breakdown
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={exportSchedule}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border/50 hover:bg-card/50">
                                            <TableHead className="text-muted-foreground pl-4">Month</TableHead>
                                            <TableHead className="text-muted-foreground">EMI</TableHead>
                                            <TableHead className="text-emerald-400">Principal</TableHead>
                                            <TableHead className="text-rose-400">Interest</TableHead>
                                            <TableHead className="text-muted-foreground text-right pr-4">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {schedule.slice(0, 15).map((row) => (
                                            <TableRow key={row.month} className="border-border/50 hover:bg-card/50">
                                                <TableCell className="text-foreground font-medium pl-4">{row.month}</TableCell>
                                                <TableCell className="text-foreground">₹{row.emi.toLocaleString()}</TableCell>
                                                <TableCell className="text-emerald-400">₹{row.principal.toLocaleString()}</TableCell>
                                                <TableCell className="text-rose-400">₹{row.interest.toLocaleString()}</TableCell>
                                                <TableCell className="text-foreground text-right pr-4">₹{row.balance.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                        {schedule.length > 15 && (
                                            <TableRow className="border-border/50">
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                                                    Showing first 15 months. Export to see full schedule.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Insights Section */}
            <Card className="bg-gradient-to-br from-primary/10 to-indigo-500/10 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-400" />
                        Financial Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg">
                            <Award className="h-5 w-5 text-emerald-400 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-foreground">Interest Savings</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    By increasing your EMI by 10%, you can save ₹{(totalInterest * 0.15).toLocaleString()} in interest
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg">
                            <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-foreground">Time Reduction</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Prepaying ₹1,00,000 can reduce your loan tenure by approximately {Math.max(1, Math.floor((100000 / emi) / 12))} years
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg">
                            <Globe className="h-5 w-5 text-purple-400 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-foreground">Market Comparison</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Current {loanType} loan rates range from {Math.max(6, rate - 1.5)}% to {rate + 2}%. Shop around for better rates.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Saved Comparisons */}
            <AnimatePresence>
                {showSavedComparisons && savedComparisons.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="bg-card/50 border-border/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <BookmarkCheck className="h-5 w-5 text-emerald-400" />
                                    Saved Comparisons
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Your saved loan configurations
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {savedComparisons.map((comparison) => (
                                    <div
                                        key={comparison.id}
                                        className="p-4 rounded-lg bg-card/50 border border-border/50 space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <p className="font-medium text-sm text-foreground truncate">{comparison.label}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() => loadComparison(comparison)}
                                                >
                                                    <CompareArrows className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => deleteComparison(comparison.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            <div>
                                                <span className="text-muted-foreground">Amount:</span>
                                                <span className="ml-1 font-mono">₹{comparison.amount.toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Rate:</span>
                                                <span className="ml-1 font-mono">{comparison.rate}%</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">EMI:</span>
                                                <span className="ml-1 font-mono">₹{comparison.emi.toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Interest:</span>
                                                <span className="ml-1 font-mono">₹{comparison.totalInterest.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(comparison.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Comparison View */}
            <AnimatePresence>
                {showComparison && previousComparison && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <CompareArrows className="h-5 w-5 text-blue-400" />
                                    Loan Comparison
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-muted-foreground text-sm uppercase">Previous</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="p-3 bg-card/50 rounded-lg">
                                                <div className="text-muted-foreground text-xs">EMI</div>
                                                <div className="text-foreground font-bold text-lg">₹{previousComparison.emi.toLocaleString()}</div>
                                            </div>
                                            <div className="p-3 bg-card/50 rounded-lg">
                                                <div className="text-muted-foreground text-xs">Total Interest</div>
                                                <div className="text-rose-400 font-bold">₹{previousComparison.totalInterest.toLocaleString()}</div>
                                            </div>
                                            <div className="p-3 bg-card/50 rounded-lg">
                                                <div className="text-muted-foreground text-xs">Total Payment</div>
                                                <div className="text-foreground font-bold">₹{previousComparison.totalPayment.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-emerald-400 text-sm uppercase">Current</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                                                <div className="text-muted-foreground text-xs">EMI</div>
                                                <div className="text-emerald-400 font-bold text-lg">₹{emi.toLocaleString()}</div>
                                            </div>
                                            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                                                <div className="text-muted-foreground text-xs">Total Interest</div>
                                                <div className="text-emerald-400 font-bold">₹{totalInterest.toLocaleString()}</div>
                                            </div>
                                            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                                                <div className="text-muted-foreground text-xs">Total Payment</div>
                                                <div className="text-emerald-400 font-bold">₹{totalPayment.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info className="h-4 w-4 text-blue-400" />
                                        <span className="text-sm font-medium text-blue-400">Difference</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-muted-foreground text-xs">EMI Difference</div>
                                            <div className={`font-bold text-lg ${emi > previousComparison.emi ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                ₹{(emi - previousComparison.emi).toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground text-xs">Interest Savings</div>
                                            <div className={`font-bold text-lg ${totalInterest > previousComparison.totalInterest ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                ₹{(previousComparison.totalInterest - totalInterest).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Save Comparison Dialog */}
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save Loan Comparison</DialogTitle>
                    <DialogDescription>
                        Add a label to help you remember this loan configuration
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Label (optional)</Label>
                        <Input
                            value={comparisonLabel}
                            onChange={(e) => setComparisonLabel(e.target.value)}
                            placeholder="e.g., Home Loan - SBI, Car Loan - HDFC, etc."
                        />
                    </div>
                    <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Loan Amount:</span>
                            <span className="font-mono font-bold">₹{amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Interest Rate:</span>
                            <span className="font-mono font-bold">{rate}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tenure:</span>
                            <span className="font-mono font-bold">{tenure} {tenureType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Monthly EMI:</span>
                            <span className="font-mono font-bold text-emerald-500">₹{emi.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setIsSaveDialogOpen(false);
                            setComparisonLabel('');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button onClick={confirmSaveComparison}>
                        <BookmarkPlus className="mr-2 h-4 w-4" />
                        Save Comparison
                    </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
    );
}