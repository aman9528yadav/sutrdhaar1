"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchFAQs, addFAQ, updateFAQ, deleteFAQ, FAQ } from '@/lib/faq-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, Check, X, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function FaqManager() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswer, setNewAnswer] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editQuestion, setEditQuestion] = useState('');
    const [editAnswer, setEditAnswer] = useState('');

    const loadFaqs = async () => {
        setIsLoading(true);
        const data = await fetchFAQs();
        setFaqs(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadFaqs();
        const channel = supabase.channel('faq_manager')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_faqs' }, () => {
                loadFaqs();
            })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleAdd = async () => {
        if (!newQuestion.trim() || !newAnswer.trim()) return;
        const res = await addFAQ(newQuestion, newAnswer);
        if (res.error) {
            alert('Failed to add FAQ: ' + (res.error.message || JSON.stringify(res.error)));
        } else {
            setNewQuestion('');
            setNewAnswer('');
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editQuestion.trim() || !editAnswer.trim()) return;
        const success = await updateFAQ(id, editQuestion, editAnswer);
        if (success) {
            setEditingId(null);
        } else {
            alert('Failed to update FAQ');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
        const success = await deleteFAQ(id);
        if (!success) alert('Failed to delete FAQ');
    };

    const startEditing = (faq: FAQ) => {
        setEditingId(faq.id);
        setEditQuestion(faq.question);
        setEditAnswer(faq.answer);
    };

    if (isLoading) return <div className="p-4 text-center text-muted-foreground">Loading FAQs...</div>;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 px-1 mb-2">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <HelpCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Support FAQs</h3>
                    <p className="text-sm text-muted-foreground">Manage the Help Center questions in real-time.</p>
                </div>
            </div>

            {/* Add New FAQ */}
            <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <h4 className="text-sm font-semibold">Add New FAQ</h4>
                <Input 
                    placeholder="Question..." 
                    value={newQuestion} 
                    onChange={e => setNewQuestion(e.target.value)} 
                    className="bg-background/50 border-white/10"
                />
                <textarea 
                    placeholder="Answer..." 
                    value={newAnswer} 
                    onChange={e => setNewAnswer(e.target.value)} 
                    className="w-full h-24 bg-background/50 border border-white/10 rounded-xl p-3 text-sm focus-visible:ring-1 focus-visible:ring-purple-500/50 resize-none placeholder:text-muted-foreground"
                />
                <Button 
                    onClick={handleAdd} 
                    disabled={!newQuestion.trim() || !newAnswer.trim()}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add FAQ
                </Button>
            </div>

            {/* List FAQs */}
            <div className="space-y-3">
                {faqs.map(faq => (
                    <motion.div key={faq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-sm group">
                        {editingId === faq.id ? (
                            <div className="space-y-3">
                                <Input 
                                    value={editQuestion} 
                                    onChange={e => setEditQuestion(e.target.value)} 
                                    className="bg-background/50 border-white/10"
                                />
                                <textarea 
                                    value={editAnswer} 
                                    onChange={e => setEditAnswer(e.target.value)} 
                                    className="w-full h-24 bg-background/50 border border-white/10 rounded-xl p-3 text-sm focus-visible:ring-1 focus-visible:ring-purple-500/50 resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                        <X className="w-4 h-4 mr-1" /> Cancel
                                    </Button>
                                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleUpdate(faq.id)}>
                                        <Check className="w-4 h-4 mr-1" /> Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-start gap-4">
                                    <h4 className="font-bold text-sm text-foreground mb-1">{faq.question}</h4>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" onClick={() => startEditing(faq)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleDelete(faq.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                            </div>
                        )}
                    </motion.div>
                ))}
                {faqs.length === 0 && (
                    <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl text-muted-foreground text-sm">
                        No FAQs found. Add one above!
                    </div>
                )}
            </div>
        </div>
    );
}
