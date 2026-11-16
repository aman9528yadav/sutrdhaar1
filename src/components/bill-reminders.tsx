"use client";

import React, { useState } from 'react';
import { useProfile, BillReminder } from '@/context/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, CheckCircle2, Circle, Calendar, Bell } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format, isPast, isToday, addDays, parseISO } from 'date-fns';

export function BillReminders() {
    const { profile, addBillReminder, updateBillReminder, deleteBillReminder } = useProfile();
    const { billReminders } = profile;
    const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<BillReminder | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'once'>('monthly');

    const handleAddReminder = () => {
        if (!title || !amount || !dueDate) return;
        addBillReminder({
            title,
            amount: parseFloat(amount),
            dueDate,
            frequency,
            isPaid: false,
        });
        setIsAddReminderOpen(false);
        resetForm();
    };

    const handleUpdateReminder = () => {
        if (!editingReminder || !title || !amount || !dueDate) return;
        updateBillReminder({
            ...editingReminder,
            title,
            amount: parseFloat(amount),
            dueDate,
            frequency,
        });
        setEditingReminder(null);
        resetForm();
    };

    const startEditing = (reminder: BillReminder) => {
        setEditingReminder(reminder);
        setTitle(reminder.title);
        setAmount(reminder.amount.toString());
        setDueDate(reminder.dueDate);
        setFrequency(reminder.frequency);
        setIsAddReminderOpen(true);
    };

    const resetForm = () => {
        setTitle('');
        setAmount('');
        setDueDate('');
        setFrequency('monthly');
        setEditingReminder(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this bill reminder?')) {
            deleteBillReminder(id);
        }
    };

    const togglePaid = (reminder: BillReminder) => {
        updateBillReminder({
            ...reminder,
            isPaid: !reminder.isPaid
        });
    };

    const getStatusColor = (dueDate: string, isPaid: boolean) => {
        if (isPaid) return 'text-emerald-500';
        if (isPast(parseISO(dueDate)) && !isToday(parseISO(dueDate))) return 'text-red-500';
        if (isToday(parseISO(dueDate))) return 'text-amber-500';
        return 'text-muted-foreground';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Bill Reminders</h3>
                    <p className="text-sm text-muted-foreground">Stay on top of your upcoming payments</p>
                </div>
                <Dialog open={isAddReminderOpen} onOpenChange={(open) => {
                    setIsAddReminderOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Add Bill
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingReminder ? 'Edit Bill Reminder' : 'Add Bill Reminder'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Bill Title</Label>
                                <Input
                                    placeholder="e.g. Netflix, Rent, Electricity"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-8"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Frequency</Label>
                                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="once">One-time</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddReminderOpen(false)}>Cancel</Button>
                            <Button onClick={editingReminder ? handleUpdateReminder : handleAddReminder} className="bg-indigo-500 hover:bg-indigo-600">
                                {editingReminder ? 'Update Bill' : 'Add Bill'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {billReminders.map(reminder => (
                    <Card key={reminder.id} className="border-white/10 hover:bg-white/5 transition-colors group">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => togglePaid(reminder)} className="focus:outline-none">
                                    {reminder.isPaid ? (
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                    ) : (
                                        <Circle className="h-6 w-6 text-muted-foreground hover:text-emerald-500 transition-colors" />
                                    )}
                                </button>
                                <div>
                                    <h4 className={`font-semibold text-lg ${reminder.isPaid ? 'line-through text-muted-foreground' : ''}`}>
                                        {reminder.title}
                                    </h4>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="font-medium">₹{reminder.amount.toLocaleString('en-IN')}</span>
                                        <span className={`flex items-center gap-1 ${getStatusColor(reminder.dueDate, reminder.isPaid)}`}>
                                            <Calendar className="h-3 w-3" />
                                            {format(parseISO(reminder.dueDate), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(reminder)}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(reminder.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {billReminders.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                        <Bell className="h-12 w-12 mb-4 opacity-20" />
                        <p>No bill reminders yet</p>
                        <Button variant="link" onClick={() => setIsAddReminderOpen(true)}>Add your first bill</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
