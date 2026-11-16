"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/hooks/use-toast';

interface SaveToBudgetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amount: string;
}

export function SaveToBudgetDialog({ open, onOpenChange, amount }: SaveToBudgetDialogProps) {
    const { profile, addTransaction } = useProfile();
    const { budget } = profile;
    const { toast } = useToast();

    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState(budget.accounts[0]?.id || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const parsedAmount = parseFloat(amount.replace(/,/g, ''));

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid amount in the calculator",
                variant: "destructive"
            });
            return;
        }

        if (!description || !categoryId || !accountId) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required fields.",
                variant: "destructive"
            });
            return;
        }

        addTransaction({
            type,
            amount: parsedAmount,
            description,
            categoryId,
            accountId,
            date: new Date().toISOString(),
        });

        toast({
            title: "Transaction Added",
            description: `${type === 'income' ? 'Income' : 'Expense'} of Rs.${parsedAmount.toFixed(2)} added to budget`,
        });

        // Reset form
        setDescription('');
        setCategoryId('');
        setType('expense');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Save to Budget</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {/* Amount Display */}
                    <div className="bg-primary/10 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="text-3xl font-bold text-primary">Rs.{amount}</p>
                    </div>

                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                                type === 'expense'
                                    ? "border-red-500 bg-red-500/10 text-red-500"
                                    : "border-border hover:border-red-500/50"
                            )}
                        >
                            <ArrowDownCircle className="h-6 w-6" />
                            <span className="font-semibold text-sm">Expense</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                                type === 'income'
                                    ? "border-green-500 bg-green-500/10 text-green-500"
                                    : "border-border hover:border-green-500/50"
                            )}
                        >
                            <ArrowUpCircle className="h-6 w-6" />
                            <span className="font-semibold text-sm">Income</span>
                        </button>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Input
                            id="description"
                            placeholder="What is this for?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    {/* Category and Account */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>Category *</Label>
                            <Select value={categoryId} onValueChange={setCategoryId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
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

                        <div className="space-y-2">
                            <Label>Account *</Label>
                            <Select value={accountId} onValueChange={setAccountId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
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

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className={cn(
                                type === 'expense' ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                            )}
                        >
                            Save to Budget
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
