"use client";

import React, { useState } from 'react';
import { useProfile } from '@/context/ProfileContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ManageAccountsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManageAccountsDialog({ open, onOpenChange }: ManageAccountsDialogProps) {
    const { profile, addAccount, updateAccount, deleteAccount } = useProfile();
    const { budget } = profile;
    const { toast } = useToast();

    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
    const [accountName, setAccountName] = useState('');
    const [accountBalance, setAccountBalance] = useState('');
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

    const handleAddAccount = () => {
        if (!accountName.trim() || !accountBalance.trim()) {
            toast({
                title: "Missing Information",
                description: "Please enter an account name and initial balance.",
                variant: "destructive"
            });
            return;
        }

        addAccount({
            name: accountName,
            balance: parseFloat(accountBalance) || 0,
        });

        toast({
            title: "Account Added",
            description: `${accountName} has been added successfully.`
        });

        resetForm();
    };

    const handleEditClick = (accountId: string) => {
        const account = budget.accounts.find(a => a.id === accountId);
        if (account) {
            setEditingAccountId(accountId);
            setAccountName(account.name);
            setAccountBalance(account.balance.toString());
            setView('edit');
        }
    };

    const handleUpdateAccount = () => {
        if (!accountName.trim() || !accountBalance.trim() || !editingAccountId) {
            toast({
                title: "Missing Information",
                description: "Please enter an account name and balance.",
                variant: "destructive"
            });
            return;
        }

        const account = budget.accounts.find(a => a.id === editingAccountId);
        if (account) {
            updateAccount({
                ...account,
                name: accountName,
                balance: parseFloat(accountBalance) || 0,
            });

            toast({
                title: "Account Updated",
                description: `${accountName} has been updated successfully.`
            });

            resetForm();
        }
    };

    const handleDeleteClick = (accountId: string) => {
        setAccountToDelete(accountId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (accountToDelete) {
            deleteAccount(accountToDelete);
            toast({
                title: "Account Deleted",
                description: "Account has been removed successfully."
            });
            setDeleteDialogOpen(false);
            setAccountToDelete(null);
        }
    };

    const resetForm = () => {
        setAccountName('');
        setAccountBalance('');
        setEditingAccountId(null);
        setView('list');
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                            {view === 'list' && 'Manage Accounts'}
                            {view === 'add' && 'Add Account'}
                            {view === 'edit' && 'Edit Account'}
                        </DialogTitle>
                    </DialogHeader>

                    {view === 'list' && (
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                                {budget.accounts.map((account) => {
                                    return (
                                        <div
                                            key={account.id}
                                            className="p-4 rounded-xl bg-card/50 border border-white/5 hover:bg-card/80 transition-all space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-500">
                                                        <Wallet className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{account.name}</p>
                                                        <p className="text-xs text-muted-foreground font-semibold">
                                                            ₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditClick(account.id)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(account.id)}
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <Button
                                onClick={() => setView('add')}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Account
                            </Button>
                        </div>
                    )}

                    {(view === 'add' || view === 'edit') && (
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="accountName">Account Name *</Label>
                                <Input
                                    id="accountName"
                                    placeholder="e.g., Checking, Savings, Wallet"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="accountBalance">Current Balance *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input
                                        id="accountBalance"
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-8"
                                        value={accountBalance}
                                        onChange={(e) => setAccountBalance(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={resetForm}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={view === 'edit' ? handleUpdateAccount : handleAddAccount}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                                >
                                    {view === 'edit' ? 'Update Account' : 'Add Account'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this account? Any associated transactions will remain but may not reflect properly in balances.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
