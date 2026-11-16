"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useProfile } from '@/context/ProfileContext';
import { generateAIContent } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';

export function AiAssistant() {
    const { profile } = useProfile();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
        { role: 'ai', content: "Hi! I'm your AI Assistant. How can I help you today?" }
    ]);
    const [showTeaser, setShowTeaser] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const prompt = `You are a helpful AI assistant built into a personal productivity app called Sutradhaar. You help the user manage notes, todos, budget, and translations. Keep your answers relatively concise.\n\nUser: ${userMsg}`;
            const response = await generateAIContent(prompt);
            
            setMessages(prev => [...prev, { role: 'ai', content: response }]);
        } catch (error: any) {
            toast({ title: "Failed to connect", description: error.message, variant: "destructive" });
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I ran into an error connecting to my brain." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>


            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-40 right-6 md:bottom-28 md:right-8 z-50 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col"
                    >
                        <Card className="flex-1 flex flex-col shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden rounded-3xl">
                            <CardHeader className="p-4 border-b border-border/30 bg-muted/30 flex flex-row items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-md">AI Assistant</CardTitle>
                                        <p className="text-xs text-muted-foreground">Powered by Gemini</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>

                            <div 
                                className="flex-1 overflow-y-auto p-4 space-y-4"
                                ref={scrollRef}
                            >
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-500'}`}>
                                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-3 max-w-[85%]">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="p-3 rounded-2xl text-sm bg-muted rounded-tl-sm flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-border/30 bg-muted/10 shrink-0">
                                <form onSubmit={handleSend} className="flex gap-2">
                                    <Input 
                                        placeholder="Ask me anything..." 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        className="rounded-full bg-background/50 border-border/50"
                                    />
                                    <Button type="submit" size="icon" className="rounded-full shrink-0 bg-primary hover:bg-primary/90" disabled={isLoading || !input.trim()}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Teaser Modal */}
            <AnimatePresence>
                {showTeaser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
                        onClick={() => setShowTeaser(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-md w-full"
                        >
                            <Card className="overflow-hidden rounded-[2rem] border-border/50 bg-background/95 shadow-2xl relative">
                                <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
                                <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
                                
                                <CardContent className="p-8 relative z-10 flex flex-col items-center text-center space-y-6">
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                        <Bot className="w-10 h-10 text-white" />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-purple-600 bg-clip-text text-transparent">Meet Your AI Assistant</h2>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Instantly translate, summarize notes, and break down complex tasks. 
                                            Powered by Google Gemini.
                                        </p>
                                    </div>

                                    <div className="w-full space-y-3 pt-4">
                                        <Button 
                                            className="w-full h-12 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white shadow-lg font-bold rounded-xl"
                                            onClick={() => {
                                                setShowTeaser(false);
                                                window.dispatchEvent(new CustomEvent('navigate', { detail: 'membership' }));
                                            }}
                                        >
                                            <Sparkles className="w-5 h-5 mr-2" /> Upgrade to Premium
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="w-full h-12 rounded-xl"
                                            onClick={() => {
                                                setShowTeaser(false);
                                                window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }));
                                            }}
                                        >
                                            I have an API Key (Setup)
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
