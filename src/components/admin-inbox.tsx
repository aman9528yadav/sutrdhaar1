"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, ArrowLeft, ShieldCheck, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { fetchAllSessions, saveMessageSupabase, markAsReadSupabase, ChatSession } from '@/lib/chat-storage';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/context/ProfileContext';

export function AdminInboxPage() {
    const { profile } = useProfile();
    const isOwner = profile.email === 'amanyadavyadav9458@gmail.com';

    const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadSessions = async () => {
        const data = await fetchAllSessions();
        setSessions(data);
    };

    useEffect(() => {
        loadSessions();
        
        // Setup Supabase Realtime Subscriptions for ALL sessions
        const channel = supabase.channel('admin_inbox')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
                loadSessions();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_sessions' }, () => {
                loadSessions();
            })
            .subscribe();

        // Silent Polling Fallback
        const pollInterval = setInterval(() => {
            loadSessions();
        }, 3000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (selectedUserId && sessions[selectedUserId]?.unreadAdmin > 0) {
            markAsReadSupabase(selectedUserId, 'admin');
            // Optimistically clear the unread count in UI
            setSessions(prev => ({
                ...prev,
                [selectedUserId]: {
                    ...prev[selectedUserId],
                    unreadAdmin: 0
                }
            }));
        }
    }, [sessions, selectedUserId]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !selectedUserId) return;
        const text = inputValue.trim();
        const targetUserId = selectedUserId;
        setInputValue('');

        // Optimistic UI Update
        setSessions(prev => {
            const sess = prev[targetUserId];
            if (!sess) return prev;
            return {
                ...prev,
                [targetUserId]: {
                    ...sess,
                    lastUpdated: Date.now(),
                    messages: [...sess.messages, {
                        id: Date.now().toString(),
                        text,
                        sender: 'admin',
                        timestamp: Date.now()
                    }]
                }
            };
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        await saveMessageSupabase(targetUserId, 'Admin', text, 'admin');
    };

    if (!isOwner) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10 h-full">
                <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
                <p className="text-muted-foreground mt-2 max-w-md">You need administrator privileges to view the support inbox.</p>
            </div>
        );
    }

    const sessionList = Object.values(sessions)
        .filter(s => s.userName.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => b.lastUpdated - a.lastUpdated);

    const selectedSession = selectedUserId ? sessions[selectedUserId] : null;

    return (
        <div className="flex h-full w-full bg-background overflow-hidden relative">
            {/* Sidebar (Full width if no session selected, otherwise hidden) */}
            <div className={`flex-col bg-card/30 backdrop-blur-md z-10 transition-all h-full ${
                selectedSession ? 'hidden' : 'flex w-full'
            }`}>
                <div className="p-4 border-b border-border/40 bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
                    <h2 className="text-2xl font-black tracking-tight mb-4 flex items-center gap-2 text-foreground">
                        Support Inbox
                        <span className="bg-blue-500/20 text-blue-500 text-xs px-2 py-0.5 rounded-full font-bold">Admin</span>
                    </h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                            placeholder="Search users..." 
                            className="pl-9 bg-muted/50 border-transparent focus-visible:ring-blue-500/50 rounded-xl"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessionList.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No support requests found.
                        </div>
                    ) : sessionList.map(session => {
                        const lastMsg = session.messages[session.messages.length - 1];
                        return (
                            <motion.button
                                key={session.userId}
                                whileHover={{ scale: 0.99 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setSelectedUserId(session.userId)}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                                    selectedUserId === session.userId 
                                    ? 'bg-blue-500/10 border border-blue-500/20 shadow-sm' 
                                    : 'hover:bg-muted/50 border border-transparent'
                                }`}
                            >
                                <div className="relative">
                                    <Avatar className="w-12 h-12 ring-2 ring-background">
                                        <AvatarFallback className="bg-blue-500/10 text-blue-500 font-bold">
                                            {(session.userName?.[0] || 'U').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className="font-semibold text-sm truncate text-foreground">{session.userName}</h3>
                                        <span className={`text-[10px] font-medium ${selectedUserId === session.userId ? 'text-blue-500' : 'text-muted-foreground'}`}>
                                            {new Date(session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate ${session.unreadAdmin > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                        {lastMsg?.sender === 'admin' ? 'You: ' : ''}{lastMsg?.text}
                                    </p>
                                </div>
                                {session.unreadAdmin > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0 shadow-sm">
                                        <span className="text-[10px] font-bold text-white">{session.unreadAdmin}</span>
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Main Chat Area (Full width if session selected, otherwise hidden) */}
            {selectedSession && (
                <div className="flex flex-col w-full h-full relative bg-gradient-to-br from-background to-blue-500/5">
                    {/* Chat Header */}
                    <div className="h-16 px-4 border-b border-border/40 flex items-center justify-between bg-card/40 backdrop-blur-xl z-10 shrink-0">
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="mr-1 text-muted-foreground hover:text-foreground shrink-0"
                                onClick={() => setSelectedUserId(null)}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Avatar className="w-10 h-10 ring-2 ring-background shadow-sm">
                                <AvatarFallback className="bg-blue-500/10 text-blue-500 font-bold">
                                    {(selectedSession.userName?.[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-bold text-foreground text-sm">{selectedSession.userName || 'Unknown User'}</h3>
                                <p className="text-[10px] font-medium text-muted-foreground">ID: {selectedSession.userId}</p>
                            </div>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
                        {selectedSession.messages.map((msg, i) => {
                            const isAdmin = msg.sender === 'admin';
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={msg.id} 
                                    className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${isAdmin ? 'bg-blue-500/20' : 'bg-muted'}`}>
                                        {isAdmin ? <ShieldCheck className="w-4 h-4 text-blue-500" /> : <User className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                    <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                        <div className={`px-5 py-3 rounded-2xl text-sm shadow-sm ${
                                            isAdmin 
                                            ? 'bg-blue-600 text-white rounded-tr-sm' 
                                            : 'bg-card border border-border/40 text-foreground rounded-tl-sm'
                                        }`}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1.5 px-1 font-medium">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-background/60 backdrop-blur-xl border-t border-border/40 z-10 shrink-0">
                        <div className="flex items-end gap-2 bg-muted/30 p-2 border border-border/40 rounded-2xl shadow-sm focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a reply as Admin..."
                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-11 resize-none"
                            />
                            <div className="flex items-center gap-1 pb-1">
                                <Button 
                                    size="icon" 
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim()}
                                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all ml-1 shrink-0"
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
