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
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';

interface ManageCategoriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManageCategoriesDialog({ open, onOpenChange }: ManageCategoriesDialogProps) {
    const { profile, addCategory, updateCategory, deleteCategory } = useProfile();
    const { budget } = profile;
    const { toast } = useToast();

    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
    const [categoryName, setCategoryName] = useState('');
    const [budgetLimit, setBudgetLimit] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    const handleAddCategory = () => {
        if (!categoryName.trim()) {
            toast({
                title: "Missing Information",
                description: "Please enter a category name.",
                variant: "destructive"
            });
            return;
        }

        addCategory({
            name: categoryName,
            icon: 'Tag', // Default icon
            budgetLimit: budgetLimit ? parseFloat(budgetLimit) : undefined,
        });

        toast({
            title: "Category Added",
            description: `${categoryName} has been added successfully.`
        });

        resetForm();
    };

    const handleEditClick = (categoryId: string) => {
        const category = budget.categories.find(c => c.id === categoryId);
        if (category) {
            setEditingCategoryId(categoryId);
            setCategoryName(category.name);
            setBudgetLimit(category.budgetLimit?.toString() || '');
            setView('edit');
        }
    };

    const handleUpdateCategory = () => {
        if (!categoryName.trim() || !editingCategoryId) {
            toast({
                title: "Missing Information",
                description: "Please enter a category name.",
                variant: "destructive"
            });
            return;
        }

        const category = budget.categories.find(c => c.id === editingCategoryId);
        if (category) {
            updateCategory({
                ...category,
                name: categoryName,
                budgetLimit: budgetLimit ? parseFloat(budgetLimit) : undefined,
            });

            toast({
                title: "Category Updated",
                description: `${categoryName} has been updated successfully.`
            });

            resetForm();
        }
    };

    const handleDeleteClick = (categoryId: string) => {
        setCategoryToDelete(categoryId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (categoryToDelete) {
            deleteCategory(categoryToDelete);
            toast({
                title: "Category Deleted",
                description: "Category has been removed successfully."
            });
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    };

    const resetForm = () => {
        setCategoryName('');
        setBudgetLimit('');
        setEditingCategoryId(null);
        setView('list');
    };

    const calculateSpent = (categoryId: string) => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return budget.transactions
            .filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === currentMonth &&
                    d.getFullYear() === currentYear &&
                    t.categoryId === categoryId &&
                    t.type === 'expense';
            })
            .reduce((sum, t) => sum + t.amount, 0);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                            {view === 'list' && 'Manage Categories'}
                            {view === 'add' && 'Add Category'}
                            {view === 'edit' && 'Edit Category'}
                        </DialogTitle>
                    </DialogHeader>

                    {view === 'list' && (
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                                {budget.categories.map((category) => {
                                    const spent = calculateSpent(category.id);
                                    const limit = category.budgetLimit || 0;
                                    const progress = limit > 0 ? (spent / limit) * 100 : 0;

                                    return (
                                        <div
                                            key={category.id}
                                            className="p-4 rounded-xl bg-card/50 border border-white/5 hover:bg-card/80 transition-all space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                                                        <Tag className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{category.name}</p>
                                                        {limit > 0 && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Limit: ₹{limit.toLocaleString('en-IN')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditClick(category.id)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(category.id)}
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {limit > 0 && (
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className={spent > limit ? "text-red-500 font-medium" : "text-muted-foreground"}>
                                                            ₹{spent.toLocaleString('en-IN')} spent
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {Math.round(progress)}%
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={Math.min(progress, 100)}
                                                        className="h-1.5"
                                                        indicatorClassName={spent > limit ? "bg-red-500" : undefined}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <Button
                                onClick={() => setView('add')}
                                className="w-full bg-emerald-500 hover:bg-emerald-600"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Category
                            </Button>
                        </div>
                    )}

                    {(view === 'add' || view === 'edit') && (
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="categoryName">Category Name *</Label>
                                <Input
                                    id="categoryName"
                                    placeholder="e.g., Groceries, Rent"
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="budgetLimit">Monthly Budget Limit (Optional)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input
                                        id="budgetLimit"
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-8"
                                        value={budgetLimit}
                                        onChange={(e) => setBudgetLimit(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Set a maximum spending limit for this category.
                                </p>
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
                                    onClick={view === 'edit' ? handleUpdateCategory : handleAddCategory}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                                >
                                    {view === 'edit' ? 'Update Category' : 'Add Category'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this category? Transactions associated with it will not be deleted but may display as 'Unknown Category'.
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
