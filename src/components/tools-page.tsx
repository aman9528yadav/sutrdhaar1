"use client";

import React, { useState, useMemo } from 'react';
import {
    Calculator, History, Newspaper, ArrowRightLeft, Calendar,
    Timer, Hourglass, Wallet, BarChart2, Gem, Info, BookText,
    CheckSquare, DollarSign, Percent, FileText, Image, Music,
    Video, QrCode, Hash, Palette, FileCode, KeyRound, Search,
    ArrowUpRight, LayoutGrid, Languages, Lock, Globe, ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';
import { hasUnlockedFeature, FeatureId } from '@/lib/level-system';

interface ToolsPageProps {
    onToolSelect: (toolId: string) => void;
}

export const allTools = [
    { id: 'admin-inbox', icon: ShieldCheck, label: 'Admin Inbox', category: 'Essentials', color: 'text-red-500', bg: 'bg-red-500/10', adminOnly: true },
    { id: 'wikipedia', icon: Globe, label: 'Gyaan', category: 'Essentials', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
    { id: 'converter', icon: ArrowRightLeft, label: 'Converter', category: 'Essentials', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'calculator', icon: Calculator, label: 'Calculator', category: 'Essentials', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'notes', icon: BookText, label: 'Notes', category: 'Essentials', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'translator', icon: Languages, label: 'Translator', category: 'Essentials', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'todo', icon: CheckSquare, label: 'To-Do', category: 'Essentials', color: 'text-green-500', bg: 'bg-green-500/10' },

    { id: 'budget-tracker', icon: Wallet, label: 'Budget', category: 'Finance', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'loan-calculator', icon: DollarSign, label: 'Loan / EMI', category: 'Finance', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'discount-calculator', icon: Percent, label: 'Discount', category: 'Finance', color: 'text-rose-500', bg: 'bg-rose-500/10' },

    { id: 'timer', icon: Timer, label: 'Timer', category: 'Time', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { id: 'stopwatch', icon: Hourglass, label: 'Stopwatch', category: 'Time', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'date-calculator', icon: Calendar, label: 'Date Calc', category: 'Time', color: 'text-pink-500', bg: 'bg-pink-500/10' },

    { id: 'password-generator', icon: KeyRound, label: 'Password Gen', category: 'Utilities', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'history', icon: History, label: 'History', category: 'Utilities', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics', category: 'Utilities', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 'news', icon: Newspaper, label: 'News', category: 'Utilities', color: 'text-sky-500', bg: 'bg-sky-500/10', externalLink: 'https://aman9528.wixstudio.com/my-site-3' },
    { id: 'about', icon: Info, label: 'About', category: 'Utilities', color: 'text-slate-500', bg: 'bg-slate-500/10' },
    { id: 'membership', icon: Gem, label: 'Membership', category: 'Utilities', color: 'text-amber-500', bg: 'bg-amber-500/10' },

    { id: 'pdf', icon: FileText, label: 'PDF Tools', category: 'Coming Soon', color: 'text-red-500', bg: 'bg-red-500/10', comingSoon: true },
    { id: 'image-tools', icon: Image, label: 'Image Tools', category: 'Coming Soon', color: 'text-violet-500', bg: 'bg-violet-500/10', comingSoon: true },
    { id: 'qr-code', icon: QrCode, label: 'QR Code', category: 'Coming Soon', color: 'text-blue-600', bg: 'bg-blue-600/10', comingSoon: true },
    { id: 'color-picker', icon: Palette, label: 'Color Picker', category: 'Coming Soon', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', comingSoon: true },
    { id: 'hash-generator', icon: Hash, label: 'Hash Gen', category: 'Coming Soon', color: 'text-slate-600', bg: 'bg-slate-600/10', comingSoon: true },
    { id: 'code-formatter', icon: FileCode, label: 'Code Format', category: 'Coming Soon', color: 'text-teal-500', bg: 'bg-teal-500/10', comingSoon: true },
    { id: 'video-tools', icon: Video, label: 'Video Tools', category: 'Coming Soon', color: 'text-purple-600', bg: 'bg-purple-600/10', comingSoon: true },
    { id: 'audio-tools', icon: Music, label: 'Audio Tools', category: 'Coming Soon', color: 'text-pink-600', bg: 'bg-pink-600/10', comingSoon: true },
];

const categories = ["All", "Essentials", "Finance", "Time", "Utilities", "Coming Soon"];

export function ToolsPage({ onToolSelect }: ToolsPageProps) {
    const { profile } = useProfile();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');

    const isOwner = profile.email === 'amanyadavyadav9458@gmail.com';

    const toolToFeatureId: Record<string, FeatureId> = {
        'calculator': 'calculator',
        'notes': 'notes',
        'todo': 'notes',
        'settings': 'settings',
        'converter': 'converter',
        'date-calculator': 'date_calc',
        'timer': 'timer',
        'stopwatch': 'timer',
        'analytics': 'analytics',
        'password-generator': 'password_gen',
        'budget-tracker': 'budget',
        'translator': 'translator',
        'loan-calculator': 'loan_calc',
        'discount-calculator': 'discount_calc',
        'history': 'save_history',
    };

    const filteredTools = useMemo(() => {
        let tools = allTools;
        if (!isOwner) {
            tools = tools.filter(t => !t.adminOnly);
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return tools.filter(tool => 
                tool.label.toLowerCase().includes(query) || 
                tool.category.toLowerCase().includes(query)
            );
        }
        
        if (activeTab === 'All') return tools;
        return tools.filter(tool => tool.category === activeTab);
    }, [searchQuery, activeTab, isOwner]);

    return (
        <div className="p-4 space-y-6 pb-32 w-full mx-auto">
            {/* Header Area */}
            <div className="flex flex-col gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <LayoutGrid className="w-6 h-6 text-primary" />
                        Toolbox
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Powerful utilities to supercharge your workflow.
                    </p>
                </div>
                
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search for tools..."
                        className="pl-10 bg-card border-border/50 focus-visible:ring-primary h-12 rounded-xl shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Pill Tabs */}
            <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2 -mx-4 px-4">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300",
                            activeTab === cat 
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105" 
                                : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Tools Grid */}
            {filteredTools.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="text-center py-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-card/30"
                >
                    <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-1 text-foreground">No tools found</h3>
                    <p className="text-muted-foreground">We couldn't find any tools matching your search.</p>
                </motion.div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3 sm:gap-4"
                >
                    <AnimatePresence>
                        {filteredTools.map((tool) => {
                            const featureId = toolToFeatureId[tool.id];
                            const isRestricted = featureId && !hasUnlockedFeature(profile, featureId);
                            return (
                            <motion.div
                                key={tool.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card
                                    className={cn(
                                        "group flex flex-col items-center justify-center p-3 h-28 bg-card hover:bg-accent/50 border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md relative",
                                        (tool.comingSoon || isRestricted) && "opacity-60 grayscale-[0.3] hover:grayscale-0"
                                    )}
                                    onClick={() => {
                                        if (tool.comingSoon) return;
                                        if (tool.externalLink) {
                                            window.open(tool.externalLink, '_blank', 'noopener,noreferrer');
                                        } else {
                                            onToolSelect(tool.id);
                                        }
                                    }}
                                >
                                    {tool.comingSoon && (
                                        <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
                                            Soon
                                        </span>
                                    )}
                                    {isRestricted && (
                                        <span className="absolute top-2 right-2 flex items-center justify-center bg-destructive/10 p-1 rounded-full text-destructive">
                                            <Lock className="w-3 h-3" />
                                        </span>
                                    )}
                                    {tool.externalLink && (
                                        <ArrowUpRight className="absolute top-2 right-2 w-3 h-3 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                                    )}

                                    <div className={cn(
                                        "flex items-center justify-center p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 mb-2",
                                        tool.bg,
                                        tool.comingSoon ? "bg-muted" : ""
                                    )}>
                                        <tool.icon className={cn(
                                            "h-6 w-6", 
                                            tool.color,
                                            tool.comingSoon && "text-muted-foreground"
                                        )} />
                                    </div>
                                    
                                    <h3 className="font-semibold text-foreground text-xs md:text-sm text-center w-full truncate px-1 group-hover:text-primary transition-colors">
                                        {tool.label}
                                    </h3>
                                </Card>
                            </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
