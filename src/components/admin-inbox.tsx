"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, ArrowLeft, ShieldCheck, User, Trash2, Clock, Ban, CheckCheck, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { fetchAllSessions, saveMessageSupabase, markAsReadSupabase, deleteMessageSupabase, deleteSessionSupabase, deleteOldMessagesSupabase, ChatSession, ChatMessage } from '@/lib/chat-storage';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/context/ProfileContext';
import { playDing } from '@/lib/audio';

export function AdminInboxPage() {
    const { profile } = useProfile();
    const isOwner = profile.email === 'amanyadavyadav9458@gmail.com';

    const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open');
    const [inputValue, setInputValue] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
    const typingChannelRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadSessions = async () => {
        const data = await fetchAllSessions();
        setSessions(data);
    };

    useEffect(() => {
        // Clean up old messages first
        deleteOldMessagesSupabase().then(() => {
            loadSessions();
        });
        
        // Setup Supabase Realtime Subscriptions for ALL sessions
        const channel = supabase.channel('admin_inbox')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
                if (payload.new && payload.new.sender === 'user') {
                    playDing();
                }
                loadSessions();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_messages' }, () => {
                loadSessions();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_sessions' }, () => {
                loadSessions();
            })
            .subscribe();

        // Broadcast Admin Presence
        const presenceChannel = supabase.channel('admin_status');
        presenceChannel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({ online_at: new Date().toISOString(), is_admin: true });
            }
        });

        // Listen for User Presence
        const userPresenceChannel = supabase.channel('global_presence');
        userPresenceChannel.on('presence', { event: 'sync' }, () => {
            const state = userPresenceChannel.presenceState();
            const online = new Set<string>();
            Object.values(state).forEach(presences => {
                presences.forEach((p: any) => {
                    if (p.user_id) online.add(p.user_id);
                });
            });
            setOnlineUsers(online);
        }).subscribe();

        // Listen for Typing Events
        const typingChannel = supabase.channel('global_typing')
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.sender === 'user') {
                    setTypingUsers(prev => new Set(prev).add(payload.userId));
                    if (typingTimeoutRef.current[payload.userId]) {
                        clearTimeout(typingTimeoutRef.current[payload.userId]);
                    }
                    typingTimeoutRef.current[payload.userId] = setTimeout(() => {
                        setTypingUsers(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(payload.userId);
                            return newSet;
                        });
                    }, 2000);
                }
            })
            .subscribe();
        typingChannelRef.current = typingChannel;

        // Silent Polling Fallback
        const pollInterval = setInterval(() => {
            loadSessions();
        }, 3000);

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(presenceChannel);
            supabase.removeChannel(userPresenceChannel);
            supabase.removeChannel(typingChannel);
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

    const handleDeleteMessage = async (messageId: string) => {
        // Optimistic UI Update
        setSessions(prev => {
            if (!selectedUserId) return prev;
            const sess = prev[selectedUserId];
            if (!sess) return prev;
            return {
                ...prev,
                [selectedUserId]: {
                    ...sess,
                    messages: sess.messages.filter(m => m.id !== messageId)
                }
            };
        });
        await deleteMessageSupabase(messageId);
    };

    const handleToggleBlock = async (userId: string, isCurrentlyBlocked: boolean, messages: ChatMessage[]) => {
        if (isCurrentlyBlocked) {
            // Unblock
            const blockMsgs = messages.filter(m => m.text === '[SYSTEM_BLOCK]');
            for (const m of blockMsgs) {
                await handleDeleteMessage(m.id);
            }
        } else {
            // Block
            const text = '[SYSTEM_BLOCK]';
            setSessions(prev => {
                const sess = prev[userId];
                if (!sess) return prev;
                return {
                    ...prev,
                    [userId]: {
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
            await saveMessageSupabase(userId, 'Admin', text, 'admin');
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        if (selectedUserId && typingChannelRef.current) {
            typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { sender: 'admin', userId: selectedUserId } });
        }
    };

    const handleResolve = async (userId: string) => {
        const text = '[SYSTEM_RESOLVED]';
        setSessions(prev => {
            const sess = prev[userId];
            if (!sess) return prev;
            return {
                ...prev,
                [userId]: {
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
        await saveMessageSupabase(userId, 'Admin', text, 'admin');
    };

    const handleDeleteSession = async (e: React.MouseEvent, targetUserId: string) => {
        e.stopPropagation();
        // Optimistic UI Update
        setSessions(prev => {
            const newSessions = { ...prev };
            delete newSessions[targetUserId];
            return newSessions;
        });
        if (selectedUserId === targetUserId) {
            setSelectedUserId(null);
        }
        await deleteSessionSupabase(targetUserId);
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

    const checkIsResolved = (session: ChatSession) => {
        const msgs = session.messages.filter(m => m.text === '[SYSTEM_RESOLVED]' || m.sender === 'user');
        if (msgs.length === 0) return false;
        return msgs[msgs.length - 1].text === '[SYSTEM_RESOLVED]';
    };

    const sessionList = Object.values(sessions)
        .filter(s => s.userName.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(s => activeTab === 'resolved' ? checkIsResolved(s) : !checkIsResolved(s))
        .sort((a, b) => b.lastUpdated - a.lastUpdated);

    const selectedSession = selectedUserId ? sessions[selectedUserId] : null;
    const isSelectedBlocked = selectedSession?.messages.some(m => m.text === '[SYSTEM_BLOCK]') || false;

    return (
        <div className="flex h-full w-full relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background">
            {/* Sidebar (Full width if no session selected, otherwise hidden) */}
            <div className={`flex-col bg-background/40 backdrop-blur-3xl border-r border-white/5 z-10 transition-all h-full ${
                selectedSession ? 'hidden' : 'flex w-full md:w-80 lg:w-96 shrink-0'
            }`}>
                <div className="p-4 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-transparent">
                    <h2 className="text-2xl font-black tracking-tight mb-4 flex items-center gap-2 text-foreground drop-shadow-sm">
                        Support Inbox
                        <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/20 shadow-sm">AmanYadav</span>
                    </h2>
                    
                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 p-1 bg-black/20 dark:bg-white/5 rounded-xl border border-white/5 shadow-inner">
                        <button 
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${activeTab === 'open' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                            onClick={() => setActiveTab('open')}
                        >
                            Open
                        </button>
                        <button 
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${activeTab === 'resolved' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                            onClick={() => setActiveTab('resolved')}
                        >
                            Resolved
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                            placeholder="Search users..." 
                            className="pl-9 bg-black/20 dark:bg-white/5 border border-white/5 focus-visible:ring-1 focus-visible:ring-indigo-500/50 rounded-xl shadow-inner transition-all h-10 text-sm"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessionList.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            {activeTab === 'open' ? 'No open support requests.' : 'No resolved support requests.'}
                        </div>
                    ) : sessionList.map(session => {
                        const visibleMessages = session.messages.filter(m => m.text !== '[SYSTEM_BLOCK]' && m.text !== '[SYSTEM_RESOLVED]');
                        const lastMsg = visibleMessages[visibleMessages.length - 1];
                        const isBlocked = session.messages.some(m => m.text === '[SYSTEM_BLOCK]');
                        return (
                            <motion.button
                                key={session.userId}
                                whileHover={{ scale: 0.99, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setSelectedUserId(session.userId)}
                                className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all group border border-transparent hover:border-white/5 ${
                                    selectedUserId === session.userId ? 'bg-white/5 border-white/10 shadow-sm' : ''
                                }`}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 p-[1px] shadow-[0_0_15px_-5px_rgba(79,70,229,0.3)]">
                                        <Avatar className="w-full h-full rounded-full border-[2px] border-background">
                                            <AvatarFallback className="bg-muted/80 backdrop-blur-sm text-foreground font-bold">
                                                {(session.userName?.[0] || 'U').toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    {onlineUsers.has(session.userId) && (
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className="font-semibold text-sm truncate text-foreground flex items-center gap-1 drop-shadow-sm">
                                            {session.userName}
                                            {isBlocked && <Ban className="w-3 h-3 text-red-500 ml-1 drop-shadow-sm" />}
                                        </h3>
                                        <span className={`text-[10px] font-medium ${selectedUserId === session.userId ? 'text-indigo-400' : 'text-muted-foreground'}`}>
                                            {new Date(session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {session.userId !== session.userName && (
                                        <p className="text-[10px] text-muted-foreground truncate mb-1">
                                            {session.userId}
                                        </p>
                                    )}
                                    {typingUsers.has(session.userId) ? (
                                        <p className="text-xs text-indigo-400 font-medium italic animate-pulse">Typing...</p>
                                    ) : (
                                        <p className={`text-xs truncate ${session.unreadAdmin > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                                            {lastMsg?.sender === 'admin' ? 'You: ' : ''}{lastMsg?.text}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {session.unreadAdmin > 0 && (
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-[0_0_10px_-2px_rgba(79,70,229,0.5)]">
                                            <span className="text-[10px] font-bold text-white">{session.unreadAdmin}</span>
                                        </div>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => handleDeleteSession(e, session.userId)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Main Chat Area (Full width if session selected, otherwise hidden) */}
            {selectedSession && (
                <div className="flex flex-col flex-1 fixed inset-0 md:static z-[100] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background">
                    {/* Chat Header */}
                    <div className="h-16 px-4 border-b border-white/5 flex items-center justify-between bg-background/40 backdrop-blur-2xl z-10 shrink-0 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="mr-1 text-muted-foreground hover:text-foreground shrink-0 md:hidden hover:bg-white/5 transition-colors"
                                onClick={() => setSelectedUserId(null)}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 p-[1px] shadow-[0_0_15px_-5px_rgba(79,70,229,0.3)]">
                                    <Avatar className="w-full h-full rounded-full border-[2px] border-background">
                                        <AvatarFallback className="bg-muted/80 backdrop-blur-sm text-foreground font-bold">
                                            {(selectedSession.userName?.[0] || 'U').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                {onlineUsers.has(selectedSession.userId) && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Online" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground text-sm flex items-center gap-2 drop-shadow-sm">
                                    {selectedSession.userName || 'Unknown User'}
                                </h3>
                                <p className="text-[10px] font-medium text-muted-foreground/70">ID: {selectedSession.userId}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`ml-auto shrink-0 ${checkIsResolved(selectedSession) ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-green-500 hover:bg-green-500/10'}`}
                                onClick={() => handleResolve(selectedSession.userId)}
                                title="Mark as Resolved"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`shrink-0 ${isSelectedBlocked ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'}`}
                                onClick={() => handleToggleBlock(selectedSession.userId, isSelectedBlocked, selectedSession.messages)}
                                title={isSelectedBlocked ? "Unblock User" : "Block User"}
                            >
                                <Ban className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
                        <div className="flex justify-center mb-6">
                            <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-sm border border-yellow-500/20 backdrop-blur-md">
                                <Clock className="w-3.5 h-3.5" />
                                Messages older than 7 days are automatically deleted.
                            </div>
                        </div>
                        {selectedSession.messages.filter(m => m.text !== '[SYSTEM_BLOCK]' && m.text !== '[SYSTEM_RESOLVED]').map((msg, i) => {
                            const isAdmin = msg.sender === 'admin';
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={msg.id} 
                                    className={`flex gap-3 group ${isAdmin ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm border border-white/5 ${isAdmin ? 'bg-indigo-500/10' : 'bg-muted/80 backdrop-blur-sm'}`}>
                                        {isAdmin ? <ShieldCheck className="w-4 h-4 text-indigo-500" /> : <User className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                    <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                        <div className={`px-5 py-3 text-sm shadow-sm flex items-center gap-2 ${
                                            isAdmin 
                                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl rounded-tr-sm border border-indigo-400/30' 
                                            : 'bg-card/60 backdrop-blur-md text-foreground border border-white/10 rounded-2xl rounded-tl-sm'
                                        }`}>
                                            {msg.text}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className={`h-6 w-6 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity ${isAdmin ? 'text-indigo-100 hover:bg-black/20 hover:text-white' : 'text-red-500 hover:bg-red-500/10'}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1.5 px-1">
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isAdmin && (
                                                <CheckCheck className={`w-3.5 h-3.5 ${
                                                    selectedSession.unreadUser === 0 ? 'text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]' : 'text-muted-foreground/60'
                                                }`} />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {typingUsers.has(selectedSession.userId) && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm bg-muted/80 backdrop-blur-sm border border-white/5">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="bg-card/60 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 w-16">
                                    <motion.div className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                                    <motion.div className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                                    <motion.div className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies & Chat Input */}
                    <div className="p-4 pb-6 md:pb-4 bg-background/40 backdrop-blur-2xl border-t border-white/5 z-10 shrink-0 shadow-sm">
                        {/* Quick Replies */}
                        <div className="flex gap-2 overflow-x-auto pb-3 mb-1 no-scrollbar scroll-smooth">
                            {["Hello! I am AmanYadav. How can I help you with your account today?", "We are looking into this issue.", "Please clear your app cache.", "Your issue has been resolved!", "Is there anything else I can help with?"].map((reply, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setInputValue(reply)}
                                    className="whitespace-nowrap px-4 py-1.5 text-xs font-medium bg-black/20 dark:bg-white/5 hover:bg-black/30 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-full border border-white/5 transition-all shadow-sm"
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-end gap-2 bg-black/20 dark:bg-white/5 p-1.5 border border-white/5 rounded-2xl shadow-inner focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                            <Input
                                value={inputValue}
                                onChange={handleTyping}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a reply as AmanYadav..."
                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-10 resize-none text-sm placeholder:text-muted-foreground/70"
                            />
                            <div className="flex items-center gap-1">
                                <Button 
                                    size="icon" 
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isSelectedBlocked}
                                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-[0_0_15px_-3px_rgba(79,70,229,0.5)] transition-all shrink-0"
                                >
                                    <Send className="w-4 h-4 ml-0.5 drop-shadow-sm" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
