"use client";

import React from 'react';
import { Bell, Sparkles, User, LogOut, X, Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/context/ProfileContext';
import { useChangelog } from '@/hooks/useChangelog';
import { useTimer } from '@/context/TimerContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

export function GlobalHeader({ onProfileClick, onOpenSearch }: { onProfileClick?: () => void, onOpenSearch?: () => void }) {
    const { profile, logout, setProfile, markNotificationAsRead, dismissNotification } = useProfile();
    const { globalNotifications } = useChangelog();
    const { isActive } = useTimer();

    const [currentLang, setCurrentLang] = React.useState('en');

    const handleLanguageChange = (langCode: string) => {
        setCurrentLang(langCode);
        // Find the hidden Google Translate select box and change it programmatically
        const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (selectBox) {
            selectBox.value = langCode;
            selectBox.dispatchEvent(new Event('change'));
        }
    };

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'Hindi' },
        { code: 'bn', label: 'Bengali' },
        { code: 'te', label: 'Telugu' },
        { code: 'ta', label: 'Tamil' },
        { code: 'mr', label: 'Marathi' },
        { code: 'gu', label: 'Gujarati' },
        { code: 'ur', label: 'Urdu' },
        { code: 'es', label: 'Spanish' },
        { code: 'fr', label: 'French' },
        { code: 'de', label: 'German' },
        { code: 'zh-CN', label: 'Chinese' },
        { code: 'ar', label: 'Arabic' }
    ];

    if (isActive) return null;

    const activeNotifications = globalNotifications.filter(n => !profile?.settings?.dismissedNotificationIds?.includes(n.id));
    const hasUnread = activeNotifications.some(n => !profile?.settings?.readNotificationIds?.includes(n.id));

    const handleOpenChange = (open: boolean) => {
        if (open && hasUnread) {
            activeNotifications.forEach(n => {
                if (!profile?.settings?.readNotificationIds?.includes(n.id)) {
                    markNotificationAsRead(n.id);
                }
            });
        }
    };

    return (
        <header className="z-50 w-full max-w-[412px] bg-background/70 backdrop-blur-2xl border-b border-border/40 shrink-0 relative">
            {/* Subtle top glow */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            <div className="flex items-center justify-between h-16 px-5 w-full">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground">
                        Sutradhaar
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors" onClick={() => onOpenSearch && onOpenSearch()}>
                        <Search className="w-5 h-5" />
                    </Button>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                                <Globe className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl max-h-64 overflow-y-auto">
                            {languages.map(lang => (
                                <DropdownMenuItem 
                                    key={lang.code} 
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={cn("cursor-pointer font-medium", currentLang === lang.code && "text-primary bg-primary/10")}
                                >
                                    {lang.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu onOpenChange={handleOpenChange}>
                        <DropdownMenuTrigger asChild>
                            <div className="relative">
                                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                                    <Bell className="w-5 h-5" />
                                </Button>
                                {hasUnread && (
                                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-background animate-pulse" />
                                )}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72 p-0 rounded-2xl shadow-xl border-border/50 max-h-[400px] overflow-y-auto">
                            <div className="sticky top-0 bg-background/95 backdrop-blur-sm p-3 border-b border-border/50 z-10">
                                <h3 className="font-semibold text-sm">Notifications</h3>
                            </div>
                            <div className="p-1">
                                {activeNotifications.length > 0 ? (
                                    activeNotifications.map(notif => (
                                        <div key={notif.id} className="p-3 mb-1 last:mb-0 rounded-xl hover:bg-accent/50 transition-colors relative group">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="absolute top-2 right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissNotification(notif.id); }}
                                            >
                                                <X className="w-3 h-3 text-muted-foreground" />
                                            </Button>
                                            <p className="text-sm font-medium pr-6">{notif.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1 pr-2">{notif.message}</p>
                                            <p className="text-[10px] text-muted-foreground/60 mt-2">{new Date(notif.timestamp).toLocaleString()}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-muted-foreground text-sm">
                                        No new notifications
                                    </div>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="w-8 h-8 border border-border/50 shadow-sm cursor-pointer hover:opacity-80 transition-opacity">
                                <AvatarImage src={profile?.photoUrl} alt="User" />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                    {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            {onProfileClick && !profile?.isGuest && (
                                <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer font-medium mb-1">
                                    <User className="w-4 h-4 mr-2" />
                                    My Profile
                                </DropdownMenuItem>
                            )}
                            {profile?.isGuest ? (
                                <DropdownMenuItem onClick={() => setProfile((prev: any) => ({ ...prev, isAuthenticated: false }))} className="text-primary cursor-pointer font-medium">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign In / Register
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
