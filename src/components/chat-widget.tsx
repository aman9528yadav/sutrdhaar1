import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, User, Headset, ShieldCheck, Clock, CheckCheck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useProfile } from '@/context/ProfileContext';
import { fetchSession, saveMessageSupabase, markAsReadSupabase, ChatMessage } from '@/lib/chat-storage';
import { fetchFAQs, FAQ } from '@/lib/faq-storage';
import { supabase } from '@/lib/supabaseClient';
import { playDing } from '@/lib/audio';

export function ChatWidget() {
    const { profile } = useProfile();
    
    // Generate or retrieve a persistent guest ID
    const [guestId] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sutradhaar_guest_chat_id');
            if (saved) return saved;
            const newId = 'guest_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('sutradhaar_guest_chat_id', newId);
            return newId;
        }
        return 'guest';
    });

    // Use profile email as unique ID, fallback to guest ID
    const userId = profile.email || guestId;
    const userName = profile.isGuest ? 'Guest User' : (profile.name || profile.email || 'User');

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadAdmin, setUnreadAdmin] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [isAdminOnline, setIsAdminOnline] = useState(false);
    const [view, setView] = useState<'faq' | 'chat'>('faq');
    const [searchFaq, setSearchFaq] = useState('');
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const typingChannelRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        const session = await fetchSession(userId, userName);
        setMessages(session.messages);
        setUnreadCount(session.unreadUser);
        setUnreadAdmin(session.unreadAdmin);
        
        if (session.unreadAdmin > 0) {
            setView('chat');
        }
    };

    useEffect(() => {
        if (profile.email === 'amanyadavyadav9458@gmail.com') return;
        
        loadMessages();
        
        // Setup Supabase Realtime Subscriptions
        const channel = supabase.channel(`chat_user_${userId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `user_id=eq.${userId}` }, (payload) => {
                if (payload.new && payload.new.sender === 'admin') {
                    playDing();
                }
                loadMessages();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_messages', filter: `user_id=eq.${userId}` }, () => {
                loadMessages();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_sessions', filter: `user_id=eq.${userId}` }, () => {
                loadMessages();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_faqs' }, () => {
                fetchFAQs().then(setFaqs);
            })
            .subscribe();

        // Listen for Admin Presence
        const presenceChannel = supabase.channel('admin_status');
        presenceChannel.on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            setIsAdminOnline(Object.keys(state).length > 0);
        }).subscribe();

        // Broadcast User Presence
        const userPresenceChannel = supabase.channel('global_presence');
        userPresenceChannel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await userPresenceChannel.track({ user_id: userId });
            }
        });

        // Listen for Typing Events
        const typingChannel = supabase.channel('global_typing')
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.sender === 'admin' && payload.userId === userId) {
                    setIsTyping(true);
                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
                }
            })
            .subscribe();
        typingChannelRef.current = typingChannel;

        // Silent Polling Fallback (in case WebSockets are blocked)
        const pollInterval = setInterval(() => {
            loadMessages();
        }, 3000);

        // Fetch initial FAQs
        fetchFAQs().then(setFaqs);

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(presenceChannel);
            supabase.removeChannel(userPresenceChannel);
            supabase.removeChannel(typingChannel);
            clearInterval(pollInterval);
        };
    }, [userId]);

    useEffect(() => {
        scrollToBottom();
        if (isOpen && unreadCount > 0) {
            markAsReadSupabase(userId, 'user');
            setUnreadCount(0);
        }
    }, [messages, isOpen, unreadCount, userId]);

    const handleSendMessage = async () => {
        if (profile.isGuest) return;
        if (!inputValue.trim()) return;
        const text = inputValue.trim();
        setInputValue('');

        // Optimistic UI Update
        const optimisticMessage: ChatMessage = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setTimeout(() => scrollToBottom(), 50);

        await saveMessageSupabase(userId, userName, text, 'user');
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        if (typingChannelRef.current) {
            typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { sender: 'user', userId } });
        }
    };

    const isOwner = profile.email?.toLowerCase() === 'amanyadavyadav9458@gmail.com';
    if (isOwner) return null;

    return (
        <>
            {/* Floating Action Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="fixed bottom-24 md:bottom-6 right-6 z-50"
                    >
                        <Button
                            size="icon"
                            className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 shadow-[0_0_40px_-10px_rgba(79,70,229,0.8)] text-white relative border border-white/20"
                            onClick={() => setIsOpen(true)}
                        >
                            <MessageSquare className="w-6 h-6 drop-shadow-md" />
                            {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full border-2 border-background flex items-center justify-center shadow-lg animate-bounce">
                                    <span className="text-[10px] font-bold">{unreadCount}</span>
                                </div>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[100] sm:w-[420px]"
                    >
                        <Card className="flex flex-col h-full sm:h-[600px] sm:max-h-[85vh] border-0 sm:border border-white/10 dark:border-white/5 bg-background/80 sm:bg-background/60 backdrop-blur-3xl sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-none sm:rounded-3xl overflow-hidden ring-1 ring-white/10">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/20 via-cyan-500/10 to-transparent border-b border-white/10 backdrop-blur-md shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 p-[1px] shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]">
                                        <div className="w-full h-full rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
                                            <Headset className="w-5 h-5 text-indigo-400 relative z-10" />
                                            <div className="absolute inset-0 bg-indigo-500/20 animate-pulse" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 drop-shadow-sm">
                                            {view === 'faq' ? 'Help Center' : 'AmanYadav Support'} <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                                        </h3>
                                        <p className={`text-[10px] font-bold tracking-wider uppercase ${isAdminOnline ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-muted-foreground'}`}>
                                            {isAdminOnline ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors" onClick={() => {
                                    if (view === 'chat' && unreadAdmin === 0) setView('faq');
                                    else setIsOpen(false);
                                }}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {view === 'faq' ? (
                                <div className="flex-1 flex flex-col overflow-hidden bg-background/40">
                                    <div className="p-4 border-b border-white/5 bg-black/10">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                value={searchFaq}
                                                onChange={(e) => setSearchFaq(e.target.value)}
                                                placeholder="Search for help..."
                                                className="pl-9 bg-white/5 border border-white/10 focus-visible:ring-1 focus-visible:ring-indigo-500/50 rounded-xl shadow-inner h-10 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                                        {faqs.filter(f => f.question.toLowerCase().includes(searchFaq.toLowerCase()) || f.answer.toLowerCase().includes(searchFaq.toLowerCase())).map((faq) => (
                                            <div key={faq.id} className="bg-card/40 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-sm hover:bg-white/5 transition-colors cursor-pointer group">
                                                <h4 className="text-sm font-bold text-foreground mb-1 group-hover:text-indigo-400 transition-colors">{faq.question}</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                                            </div>
                                        ))}
                                        {faqs.length === 0 && (
                                            <div className="text-center p-4 text-muted-foreground text-xs border border-dashed border-white/10 rounded-xl">
                                                No FAQs available right now. Talk to support below!
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 border-t border-white/5 bg-background/60 backdrop-blur-xl shrink-0">
                                        <Button 
                                            onClick={() => setView('chat')}
                                            className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-[0_0_15px_-3px_rgba(79,70,229,0.5)] border-0 rounded-xl h-11"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Talk to Support
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Messages Area */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 relative scroll-smooth no-scrollbar flex flex-col">
                                        <div className="flex justify-center mb-2 mt-2">
                                            <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-yellow-500/20 backdrop-blur-md max-w-[80%] text-center leading-tight">
                                                <Clock className="w-3 h-3 shrink-0" />
                                                Messages are automatically deleted after 7 days.
                                            </div>
                                        </div>
                                        {messages.filter(m => m.text !== '[SYSTEM_BLOCK]' && m.text !== '[SYSTEM_RESOLVED]').map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white/5 ${msg.sender === 'user' ? 'bg-muted/80 backdrop-blur-sm' : 'bg-indigo-500/10'}`}>
                                            {msg.sender === 'user' ? <User className="w-4 h-4 text-muted-foreground" /> : <Headset className="w-4 h-4 text-indigo-500" />}
                                        </div>
                                        <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                            <div className={`px-4 py-2.5 text-sm shadow-sm ${
                                                msg.sender === 'user' 
                                                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl rounded-tr-sm border border-indigo-400/30' 
                                                : 'bg-card/60 backdrop-blur-md text-foreground border border-white/10 rounded-2xl rounded-tl-sm'
                                            }`}>
                                                {msg.text}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1 px-1">
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {msg.sender === 'user' && (
                                                    <CheckCheck className={`w-3.5 h-3.5 ${
                                                        unreadAdmin === 0 ? 'text-blue-500' : 'text-muted-foreground/60'
                                                    }`} />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                        {isTyping && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-500/10 border border-white/5 shadow-sm">
                                                    <Headset className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <div className="bg-card/60 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 w-16">
                                                    <motion.div className="w-1.5 h-1.5 bg-indigo-500/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                                                    <motion.div className="w-1.5 h-1.5 bg-indigo-500/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                                                    <motion.div className="w-1.5 h-1.5 bg-indigo-500/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                                                </div>
                                            </motion.div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input Area */}
                                    {(() => {
                                        const isBlocked = messages.some(m => m.text === '[SYSTEM_BLOCK]');
                                        return (
                                            <div className="p-4 bg-background/40 border-t border-white/10 backdrop-blur-2xl shrink-0">
                                                <div className="flex items-center gap-2 relative bg-muted/40 p-1.5 rounded-2xl border border-white/10 shadow-inner focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                                                    <Input
                                                        value={inputValue}
                                                        onChange={handleTyping}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                        placeholder={isBlocked ? "You have been blocked from support." : profile.isGuest ? "Please login first to send msg" : "Type your message..."}
                                                        disabled={profile.isGuest || isBlocked}
                                                        className="pr-12 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-10 resize-none text-sm placeholder:text-muted-foreground/70"
                                                    />
                                                    <Button 
                                                        size="icon" 
                                                        onClick={handleSendMessage}
                                                        disabled={profile.isGuest || isBlocked || !inputValue.trim() || isTyping}
                                                        className="absolute right-1.5 top-1.5 bottom-1.5 h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-[0_0_15px_-3px_rgba(79,70,229,0.5)] transition-all"
                                                    >
                                                        <Send className="w-4 h-4 ml-0.5 drop-shadow-sm" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
