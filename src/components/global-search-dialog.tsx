"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Calculator, CheckSquare, BookText, Calendar, ArrowRightLeft, Languages, FileText, ArrowRight, X } from 'lucide-react';
import { useProfile, HistoryItem } from '@/context/ProfileContext';
import { allTools } from '@/components/tools-page';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface GlobalSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onNavigate: (toolId: string) => void;
}

export function GlobalSearchDialog({ open, onOpenChange, onNavigate }: GlobalSearchDialogProps) {
    const { profile } = useProfile();
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (open) {
            setQuery('');
        }
    }, [open]);

    // Handle Keyboard Shortcuts
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(true);
            }
        }
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [onOpenChange]);

    const handleSelect = (toolId: string) => {
        onOpenChange(false);
        onNavigate(toolId);
    };

    const results = useMemo(() => {
        if (!query.trim()) return null;

        const q = query.toLowerCase();

        // 1. Tools
        const matchedTools = allTools.filter(t => t.label.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));

        // 2. Notes
        const matchedNotes = profile.notes.filter(n => !n.isTrashed && (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)));

        // 3. Todos
        const matchedTodos = profile.todos.filter(t => t.text.toLowerCase().includes(q));

        // 4. History / Saves
        const matchedHistory = profile.history?.filter(h => {
            if (h.type === 'calculator') return h.expression.includes(q) || h.result.includes(q);
            if (h.type === 'conversion') return h.fromValue.includes(q) || h.toValue.includes(q) || h.fromUnit.toLowerCase().includes(q) || h.toUnit.toLowerCase().includes(q);
            if (h.type === 'translation') return h.sourceText.toLowerCase().includes(q) || h.translatedText.toLowerCase().includes(q);
            return false;
        }) || [];

        return {
            tools: matchedTools,
            notes: matchedNotes,
            todos: matchedTodos,
            history: matchedHistory
        };
    }, [query, profile]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 overflow-hidden max-w-lg w-full rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl [&>button]:hidden sm:top-[20%] sm:translate-y-0 translate-y-[-50%]">
                <div className="flex items-center px-4 py-3 border-b border-border/50">
                    <Search className="w-5 h-5 text-muted-foreground mr-3" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tools, notes, history..."
                        className="flex-1 border-none shadow-none focus-visible:ring-0 text-base p-0 h-8 bg-transparent"
                        autoFocus
                    />
                    <div className="text-xs text-muted-foreground bg-accent/50 px-2 py-1 rounded-md ml-2 border border-border/50 hidden sm:block">
                        ESC
                    </div>
                    <button onClick={() => onOpenChange(false)} className="sm:hidden p-2 -mr-2 text-muted-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto w-full">
                    {!query.trim() && (
                        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                            <Search className="w-10 h-10 mb-4 opacity-20" />
                            <p className="text-sm font-medium">Type to search across Sutradhaar</p>
                        </div>
                    )}

                    {query.trim() && results && (
                        <div className="p-2 space-y-4">
                            {results.tools.length === 0 && results.notes.length === 0 && results.todos.length === 0 && results.history.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No results found for "{query}"
                                </div>
                            )}

                            {results.tools.length > 0 && (
                                <div>
                                    <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tools</h4>
                                    {results.tools.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => handleSelect(t.id)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent cursor-pointer group"
                                        >
                                            <div className={cn("p-2 rounded-lg flex items-center justify-center", t.bg, t.color)}>
                                                <t.icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-foreground">{t.label}</div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {results.notes.length > 0 && (
                                <div>
                                    <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes</h4>
                                    {results.notes.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleSelect('notes')}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent cursor-pointer group"
                                        >
                                            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                                                <BookText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-foreground truncate">{n.title || 'Untitled Note'}</div>
                                                <div className="text-xs text-muted-foreground truncate">{n.content.replace(/<[^>]+>/g, '').substring(0, 50)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {results.todos.length > 0 && (
                                <div>
                                    <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tasks</h4>
                                    {results.todos.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => handleSelect('todo')}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent cursor-pointer group"
                                        >
                                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                                                <CheckSquare className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                                                    {t.text}
                                                    {t.completed && <span className="text-[10px] bg-green-500/20 text-green-500 px-1.5 rounded uppercase font-bold">Done</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {results.history.length > 0 && (
                                <div>
                                    <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">History & Saves</h4>
                                    {results.history.map(h => (
                                        <div
                                            key={h.id}
                                            onClick={() => {
                                                if (h.type === 'calculator') handleSelect('calculator');
                                                if (h.type === 'conversion') handleSelect('converter');
                                                if (h.type === 'translation') handleSelect('translator');
                                                if (h.type === 'date_calculation') handleSelect('date-calculator');
                                            }}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent cursor-pointer group"
                                        >
                                            <div className={cn("p-2 rounded-lg flex items-center justify-center", 
                                                h.type === 'calculator' && 'bg-orange-500/10 text-orange-500',
                                                h.type === 'conversion' && 'bg-blue-500/10 text-blue-500',
                                                h.type === 'translation' && 'bg-indigo-500/10 text-indigo-500',
                                            )}>
                                                {h.type === 'calculator' && <Calculator className="w-4 h-4" />}
                                                {h.type === 'conversion' && <ArrowRightLeft className="w-4 h-4" />}
                                                {h.type === 'translation' && <Languages className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {h.type === 'calculator' && (
                                                    <>
                                                        <div className="text-sm font-medium text-foreground truncate">{h.expression}</div>
                                                        <div className="text-xs text-muted-foreground truncate">= {h.result}</div>
                                                    </>
                                                )}
                                                {h.type === 'conversion' && (
                                                    <>
                                                        <div className="text-sm font-medium text-foreground truncate">{h.fromValue} {h.fromUnit} ➔ {h.toValue} {h.toUnit}</div>
                                                    </>
                                                )}
                                                {h.type === 'translation' && (
                                                    <>
                                                        <div className="text-sm font-medium text-foreground truncate">{h.sourceText}</div>
                                                        <div className="text-xs text-muted-foreground truncate">➔ {h.translatedText}</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
