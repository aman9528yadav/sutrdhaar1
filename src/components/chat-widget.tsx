import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, User, Headset, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useProfile } from '@/context/ProfileContext';
import { fetchSession, saveMessageSupabase, markAsReadSupabase, ChatMessage } from '@/lib/chat-storage';
import { supabase } from '@/lib/supabaseClient';

export function ChatWidget() {
    const { profile } = useProfile();
    const userId = profile.id || 'guest';
    const userName = profile.isGuest ? 'Guest User' : profile.name;

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        const session = await fetchSession(userId, userName);
        setMessages(session.messages);
        setUnreadCount(session.unreadUser);
    };

    useEffect(() => {
        loadMessages();
        
        // Setup Supabase Realtime Subscriptions
        const channel = supabase.channel(`chat_user_${userId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages', filter: `user_id=eq.${userId}` }, () => {
                loadMessages();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_sessions', filter: `user_id=eq.${userId}` }, () => {
                loadMessages();
            })
            .subscribe();

        // Silent Polling Fallback (in case WebSockets are blocked)
        const pollInterval = setInterval(() => {
            loadMessages();
        }, 3000);

        return () => {
            supabase.removeChannel(channel);
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
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Button
                            size="icon"
                            className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-2xl shadow-primary/30 text-white relative"
                            onClick={() => setIsOpen(true)}
                        >
                            <MessageSquare className="w-6 h-6" />
                            {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
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
                        className="fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[400px]"
                    >
                        <Card className="flex flex-col h-[500px] max-h-[80vh] border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-border/40 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center relative overflow-hidden">
                                        <Headset className="w-5 h-5 text-blue-500 relative z-10" />
                                        <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                            Admin Support <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                        </h3>
                                        <p className="text-[10px] text-green-500 font-medium tracking-wide uppercase">Online</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-muted' : 'bg-blue-500/20'}`}>
                                            {msg.sender === 'user' ? <User className="w-4 h-4 text-muted-foreground" /> : <Headset className="w-4 h-4 text-blue-500" />}
                                        </div>
                                        <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                                                msg.sender === 'user' 
                                                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                                                : 'bg-muted/80 text-foreground border border-border/30 rounded-tl-sm'
                                            }`}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-background/50 border-t border-border/40 backdrop-blur-md">
                                <div className="flex items-center gap-2 relative">
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type your message..."
                                        className="pr-12 bg-muted/50 border-transparent focus-visible:ring-primary/50 focus-visible:bg-background rounded-xl h-11"
                                    />
                                    <Button 
                                        size="icon" 
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isTyping}
                                        className="absolute right-1 top-1 bottom-1 h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
                                    >
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
