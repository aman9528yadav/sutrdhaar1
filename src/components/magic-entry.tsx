"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/ProfileContext';
import { generateAIContent } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';

const SYSTEM_PROMPT = `
You are an intelligent data-entry assistant for a productivity app.
The user will provide a natural language statement about a task to do, or a budget expense/income.
You must parse this and return a raw JSON object (without markdown code blocks like \`\`\`json).
The JSON MUST match exactly one of these structures depending on the input:

For a budget entry:
{
  "type": "budget",
  "data": {
    "amount": number, // exact amount, default to 0 if unknown
    "description": string, // short description
    "categoryType": "expense" | "income"
  }
}

For a todo/task entry:
{
  "type": "todo",
  "data": {
    "title": string, // task title
    "priority": "low" | "medium" | "high", // guess based on urgency words
    "dueDate": string | null // ISO 8601 format if a date/time is mentioned, otherwise null
  }
}

If the input is completely unrelated or nonsensical, return:
{
  "type": "unknown"
}
`;

export function MagicEntry() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { addTodo, addTransaction } = useProfile();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userInput = input.trim();
        setInput('');
        setIsLoading(true);
        setSuccessMessage(null);

        try {
            const responseText = await generateAIContent(userInput, undefined, SYSTEM_PROMPT);
            
            // Clean up the response in case the AI wraps it in markdown blocks
            let jsonString = responseText.trim();
            if (jsonString.startsWith('\`\`\`json')) {
                jsonString = jsonString.substring(7);
            }
            if (jsonString.startsWith('\`\`\`')) {
                jsonString = jsonString.substring(3);
            }
            if (jsonString.endsWith('\`\`\`')) {
                jsonString = jsonString.substring(0, jsonString.length - 3);
            }
            
            const result = JSON.parse(jsonString.trim());

            if (result.type === 'budget') {
                addTransaction({
                    type: result.data.categoryType || 'expense',
                    amount: result.data.amount || 0,
                    description: result.data.description || 'Magic Entry',
                    categoryId: result.data.categoryType === 'income' ? 'cat-income' : 'cat-misc',
                    accountId: 'default', // Fallback, the budget tracker will handle it if missing
                    date: new Date().toISOString()
                });
                
                setSuccessMessage(`Added ${result.data.categoryType === 'income' ? 'Income' : 'Expense'}: ₹${result.data.amount}`);
                toast({ title: "Magic Entry ✨", description: `Added ₹${result.data.amount} to budget.` });
                
            } else if (result.type === 'todo') {
                addTodo({
                    text: result.data.title || 'Magic Task',
                    completed: false,
                    priority: result.data.priority || 'medium',
                    dueDate: result.data.dueDate || undefined
                });
                
                setSuccessMessage(`Task Added: ${result.data.title}`);
                toast({ title: "Magic Entry ✨", description: "Task added to your list." });
                
            } else {
                toast({ title: "Hmm... 🤔", description: "I couldn't understand that entry. Try being more specific like 'Spent 500 on dinner'." });
            }

        } catch (error) {
            console.error("Magic Entry Error:", error);
            toast({ 
                title: "Magic Entry Failed", 
                description: "Ensure you have a Gemini API key set in your Profile Settings, or try again later.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
            // Clear success message after a few seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    return (
        <div className="w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-amber-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            
            <form onSubmit={handleSubmit} className="relative flex items-center bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg p-1">
                <div className="pl-3 pr-2 py-2 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                </div>
                
                <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Magic Add: 'Spent ₹500 on coffee' or 'Call John at 5pm'"
                    className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-1 text-sm placeholder:text-muted-foreground/60 h-10"
                    disabled={isLoading}
                />
                
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="pr-3 flex items-center justify-center"
                        >
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        </motion.div>
                    ) : successMessage ? (
                         <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="pr-3 flex items-center justify-center text-green-500"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="submit"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="pr-1"
                        >
                            <Button 
                                type="submit" 
                                size="icon" 
                                className="h-8 w-8 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                                disabled={!input.trim()}
                            >
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
            
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute -bottom-8 left-0 right-0 text-center"
                    >
                        <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                            {successMessage}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
