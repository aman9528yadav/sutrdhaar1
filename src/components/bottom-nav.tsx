"use client";

import React from 'react';
import { Home, LayoutGrid, History, Settings, User, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/context/TimerContext';
import { useProfile } from '@/context/ProfileContext';

interface BottomNavProps {
    activeTab: string;
    onTabSelect: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabSelect }: BottomNavProps) {
    const { isActive } = useTimer();
    const { profile } = useProfile();

    if (isActive) return null;

    const navItems = [
        { id: 'dashboard', icon: Home, label: 'Home' },
        { id: 'tools-list', icon: LayoutGrid, label: 'Tools' },
        { id: 'membership', icon: Crown, label: 'Pro', isSpecial: true },
        ...(!profile.isGuest ? [{ id: 'profile', icon: User, label: 'Profile' }] : []),
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="w-full max-w-[412px] z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe shrink-0">
            <div className="flex items-center justify-around h-16 w-full px-2">
                {navItems.map((item) => {
                    // Check if the current tab matches or if we're inside a tool and the "Tools" tab should be highlighted.
                    // For simplicity, if we are in a tool (not dashboard, history), highlight 'tools-list'.
                    let isActive = activeTab === item.id;
                    if (item.id === 'tools-list' && !['dashboard', 'history', 'tools-list', 'profile', 'settings'].includes(activeTab)) {
                        isActive = true; // highlight tools when inside a tool
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabSelect(item.id)}
                            className={cn(
                                "flex flex-col items-center justify-center w-[4.5rem] h-full gap-1 transition-all duration-200",
                                isActive ? (item.isSpecial ? "text-amber-500" : "text-primary") : (item.isSpecial ? "text-amber-500/70 hover:text-amber-500" : "text-muted-foreground hover:text-foreground")
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                                isActive ? (item.isSpecial ? "bg-amber-500/20" : "bg-primary/10") : "bg-transparent",
                                item.isSpecial && !isActive && "bg-amber-500/10"
                            )}>
                                <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                            </div>
                            <span className={cn("text-[10px] font-medium tracking-wide", item.isSpecial && "font-bold")}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
