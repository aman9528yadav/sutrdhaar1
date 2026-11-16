"use client";

import React, { useState, useEffect } from 'react';
import { useProfile, Transaction } from '@/context/ProfileContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, Repeat, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface AddTransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction?: Transaction;
}

export function AddTransactionDialog({ open, onOpenChange, transaction }: AddTransactionDialogProps) {
    const { profile, addTransaction, updateTransaction } = useProfile();
    const { budget } = profile;
    const { toast } = useToast();

    const defaultCategoryId = budget.categories[0]?.id || '';
    const defaultAccountId = budget.accounts[0]?.id || '';

    const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
    const [amount, setAmount] = useState(transaction?.amount.toString() || '');
    const [description, setDescription] = useState(transaction?.description || '');
    const [categoryId, setCategoryId] = useState(transaction?.categoryId || defaultCategoryId);
    const [accountId, setAccountId] = useState(transaction?.accountId || defaultAccountId);
    const [date, setDate] = useState<Date>(transaction?.date ? new Date(transaction.date) : new Date());
    const [recurring, setRecurring] = useState<string>(transaction?.recurring?.frequency || 'none');

    useEffect(() => {
        if (open) {
            if (transaction) {
                setType(transaction.type);
                setAmount(transaction.amount.toString());
                setDescription(transaction.description);
                setCategoryId(transaction.categoryId);
                setAccountId(transaction.accountId);
                setDate(new Date(transaction.date));
                setRecurring(transaction.recurring?.frequency || 'none');
            } else {
                setType('expense');
                setAmount('');
                setDescription('');
                setCategoryId(defaultCategoryId);
                setAccountId(defaultAccountId);
                setDate(new Date());
                setRecurring('none');
            }
        }
    }, [open, transaction, budget.accounts, budget.categories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description || !categoryId || !accountId) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required fields.",
                variant: "destructive"
            });
            return;
        }

        const recurringData = recurring !== 'none' ? {
            frequency: recurring as 'daily' | 'weekly' | 'monthly' | 'yearly',
            nextDue: date.toISOString()
        } : undefined;

        if (transaction) {
            updateTransaction({
                ...transaction,
                type,
                amount: parseFloat(amount),
                description,
                categoryId,
                accountId,
                date: date.toISOString(),
                recurring: recurringData,
            });
            toast({ title: "✅ Updated", description: "Transaction updated successfully." });
        } else {
            addTransaction({
                type,
                amount: parseFloat(amount),
                description,
                categoryId,
                accountId,
                date: date.toISOString(),
                recurring: recurringData,
            });
            toast({ title: "✅ Added", description: "Transaction added successfully." });
        }

        onOpenChange(false);
    };

    const isExpense = type === 'expense';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 overflow-hidden rounded-3xl border-border/60 w-[calc(100vw-24px)] max-w-md">
                {/* Coloured top strip */}
                <div className={cn(
                    "px-5 pt-5 pb-4 transition-colors duration-300",
                    isExpense ? "bg-gradient-to-br from-red-500/15 to-orange-500/5" : "bg-gradient-to-br from-green-500/15 to-emerald-500/5"
                )}>
                    <DialogTitle className="text-xl font-extrabold text-foreground mb-3">
                        {transaction ? 'Edit Transaction' : 'New Transaction'}
                    </DialogTitle>

                    {/* Expense / Income toggle */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200",
                                isExpense
                                    ? "border-red-500 bg-red-500 text-white shadow-md shadow-red-500/20"
                                    : "border-border/60 bg-card/50 text-muted-foreground hover:border-red-500/40"
                            )}
                        >
                            <ArrowDownCircle className="h-4 w-4" />
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200",
                                !isExpense
                                    ? "border-green-500 bg-green-500 text-white shadow-md shadow-green-500/20"
                                    : "border-border/60 bg-card/50 text-muted-foreground hover:border-green-500/40"
                            )}
                        >
                            <ArrowUpCircle className="h-4 w-4" />
                            Income
                        </button>
                    </div>

                    {/* Big amount input */}
                    <div className="mt-3 flex items-center gap-2">
                        <span className={cn("text-3xl font-bold shrink-0", isExpense ? "text-red-500" : "text-green-500")}>₹</span>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-transparent text-4xl font-extrabold text-foreground placeholder:text-muted-foreground/40 outline-none w-full"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Form body */}
                <form onSubmit={handleSubmit} className="px-5 pt-4 pb-5 space-y-3 bg-card">

                    {/* Description */}
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
                        <Input
                            placeholder="What is this for?"
                            className="h-11 rounded-xl bg-background/60 border-border/60 text-sm"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    {/* Category + Account */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="h-11 rounded-xl bg-background/60 border-border/60 text-sm">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {budget.categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</Label>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger className="h-11 rounded-xl bg-background/60 border-border/60 text-sm">
                                    <SelectValue placeholder="Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {budget.accounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Date + Recurring */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 rounded-xl justify-start text-left font-normal text-sm bg-background/60 border-border/60"
                                    >
                                        <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-50" />
                                        {format(date, "dd MMM")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(d) => d && setDate(d)}
                                        initialFocus
                                        captionLayout="dropdown-buttons"
                                        fromYear={2000}
                                        toYear={2100}
                                        className="bg-card text-foreground rounded-md border-border"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Repeat className="w-3 h-3" /> Repeat
                            </Label>
                            <Select value={recurring} onValueChange={(v: any) => setRecurring(v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-background/60 border-border/60 text-sm">
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-12 rounded-xl text-sm font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className={cn(
                                "flex-1 h-12 rounded-xl text-sm font-bold gap-2 shadow-md",
                                isExpense
                                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                    : "bg-green-500 hover:bg-green-600 shadow-green-500/20"
                            )}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {transaction ? 'Update' : 'Add'} Transaction
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
