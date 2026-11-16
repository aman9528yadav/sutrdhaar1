"use client";

import React, { useState } from 'react';
import { useProfile, SavingsGoal } from '@/context/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, Trash2, Edit2, Save, X, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function BudgetGoals() {
    const { profile, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useProfile();
    const { goals } = profile.budget;
    const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');

    const handleAddGoal = () => {
        if (!name || !targetAmount) return;
        addSavingsGoal({
            name,
            targetAmount: parseFloat(targetAmount),
        });
        setIsAddGoalOpen(false);
        resetForm();
    };

    const handleUpdateGoal = () => {
        if (!editingGoal || !name || !targetAmount) return;
        updateSavingsGoal({
            ...editingGoal,
            name,
            targetAmount: parseFloat(targetAmount),
            currentAmount: parseFloat(currentAmount) || 0,
        });
        setEditingGoal(null);
        resetForm();
    };

    const startEditing = (goal: SavingsGoal) => {
        setEditingGoal(goal);
        setName(goal.name);
        setTargetAmount(goal.targetAmount.toString());
        setCurrentAmount(goal.currentAmount.toString());
    };

    const resetForm = () => {
        setName('');
        setTargetAmount('');
        setCurrentAmount('');
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this savings goal?')) {
            deleteSavingsGoal(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Savings Goals</h3>
                    <p className="text-sm text-muted-foreground">Track your progress towards financial targets</p>
                </div>
                <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                            <Plus className="mr-2 h-4 w-4" /> New Goal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Savings Goal</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Goal Name</Label>
                                <Input
                                    placeholder="e.g. New Laptop"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Target Amount</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddGoal} className="bg-emerald-500 hover:bg-emerald-600">Create Goal</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {goals.map(goal => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100;
                    const isEditing = editingGoal?.id === goal.id;

                    if (isEditing) {
                        return (
                            <Card key={goal.id} className="border-emerald-500/50 bg-emerald-500/5">
                                <CardContent className="p-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Current</Label>
                                            <Input type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Target</Label>
                                            <Input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setEditingGoal(null)}>Cancel</Button>
                                        <Button size="sm" onClick={handleUpdateGoal}>Save</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }

                    return (
                        <Card key={goal.id} className="border-white/10 hover:bg-white/5 transition-colors group">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
                                            <Target className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg">{goal.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                ₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(goal)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(goal.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-emerald-400 font-medium">{progress.toFixed(0)}%</span>
                                        <span className="text-muted-foreground">
                                            ₹{(goal.targetAmount - goal.currentAmount).toLocaleString('en-IN')} left
                                        </span>
                                    </div>
                                    <Progress value={progress} className="h-2 bg-white/10" indicatorClassName="bg-emerald-500" />
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-400"
                                    onClick={() => {
                                        // Quick add money logic could go here
                                        const add = prompt('Add amount to savings:');
                                        if (add && !isNaN(parseFloat(add))) {
                                            updateSavingsGoal({
                                                ...goal,
                                                currentAmount: goal.currentAmount + parseFloat(add)
                                            });
                                        }
                                    }}
                                >
                                    <TrendingUp className="mr-2 h-4 w-4" /> Add Funds
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}

                {goals.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                        <Target className="h-12 w-12 mb-4 opacity-20" />
                        <p>No savings goals yet</p>
                        <Button variant="link" onClick={() => setIsAddGoalOpen(true)}>Create one now</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
