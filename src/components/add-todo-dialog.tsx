"use client";

import React, { useState } from 'react';
import { useProfile, TodoItem, SubTask } from '@/context/ProfileContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Plus, X, ListTodo, Calendar as CalendarIcon, Sparkles, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { generateAIContent } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';

interface AddTodoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    todo?: TodoItem;
}

export function AddTodoDialog({ open, onOpenChange, todo }: AddTodoDialogProps) {
    const { addTodo, updateTodo } = useProfile();
    const [text, setText] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [category, setCategory] = useState('');
    const [subtasks, setSubtasks] = useState<{ text: string; completed: boolean }[]>([]);
    const [newSubtask, setNewSubtask] = useState('');
    const [recurring, setRecurring] = useState<string>('none');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        if (open) {
            setText(todo?.text || '');
            setPriority(todo?.priority || 'medium');
            setDueDate(todo?.dueDate ? new Date(todo.dueDate) : undefined);
            setCategory(todo?.category || '');
            setSubtasks(todo?.subtasks || []);
            setNewSubtask('');
            setRecurring(todo?.recurring || 'none');
        }
    }, [open, todo]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        const subtasksWithIds: SubTask[] = subtasks.map(st => ({
            id: (st as any).id || Math.random().toString(36).substr(2, 9),
            text: st.text,
            completed: st.completed
        }));

        const recurringValue = recurring !== 'none' ? recurring as 'daily' | 'weekly' | 'monthly' : undefined;

        if (todo) {
            updateTodo({
                ...todo,
                text,
                priority,
                dueDate: dueDate?.toISOString(),
                category,
                subtasks: subtasksWithIds,
                recurring: recurringValue
            });
        } else {
            addTodo({
                text,
                priority,
                completed: false,
                dueDate: dueDate?.toISOString(),
                category,
                subtasks: subtasksWithIds,
                recurring: recurringValue
            });
        }
        onOpenChange(false);
    };

    const handleAddSubtask = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newSubtask.trim()) {
            e.preventDefault();
            setSubtasks([...subtasks, { text: newSubtask.trim(), completed: false }]);
            setNewSubtask('');
        }
    };

    const removeSubtask = (index: number) => {
        setSubtasks(subtasks.filter((_, i) => i !== index));
    };

    const handleAiBreakdown = async () => {
        if (!text.trim()) {
            toast({ title: "Task Name Required", description: "Enter a task name before breaking it down.", variant: "destructive" });
            return;
        }

        setIsAiLoading(true);
        try {
            const prompt = `Break down the following task into 3 to 7 small, actionable sub-tasks. ONLY output the sub-tasks as a plain list separated by newlines, with no bullet points, numbers, or markdown formatting.\n\nTask: ${text}`;
            const aiResponse = await generateAIContent(prompt, apiKey);
            
            const newTasks = aiResponse
                .split('\n')
                .map(line => line.replace(/^[-\*\d\.]+\s*/, '').trim())
                .filter(line => line.length > 0)
                .map(line => ({ text: line, completed: false }));
            
            if (newTasks.length > 0) {
                setSubtasks([...subtasks, ...newTasks]);
                toast({ title: "Task Broken Down!", description: "AI added new subtasks." });
            }
        } catch (error: any) {
            toast({ title: "AI Breakdown Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{todo ? 'Edit Task' : 'New Task'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4 flex-1 overflow-y-auto px-1">
                    <div className="space-y-2">
                        <Label htmlFor="task">Task Name</Label>
                        <Input
                            id="task"
                            placeholder="What needs to be done?"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal border-input bg-background hover:bg-accent hover:text-accent-foreground",
                                            !dueDate && "text-muted-foreground"
                                        )}
                                    >
                                        {dueDate ? format(dueDate, "PPP") : <span>Due Date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dueDate}
                                        onSelect={setDueDate}
                                        initialFocus
                                        captionLayout="dropdown-buttons"
                                        fromYear={2000}
                                        toYear={2100}
                                        className="bg-card text-foreground rounded-md border-border"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Recurring</Label>
                        <Select value={recurring} onValueChange={(v: any) => setRecurring(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Input
                            placeholder="e.g. Work, Personal, Shopping"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                <ListTodo className="h-4 w-4" /> Subtasks
                            </Label>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                onClick={handleAiBreakdown}
                                disabled={isAiLoading || !text.trim()}
                            >
                                {isAiLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                AI Breakdown
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a step..."
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                onKeyDown={handleAddSubtask}
                            />
                            <Button type="button" size="icon" onClick={() => {
                                if (newSubtask.trim()) {
                                    setSubtasks([...subtasks, { text: newSubtask.trim(), completed: false }]);
                                    setNewSubtask('');
                                }
                            }}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {subtasks.length > 0 && (
                            <ScrollArea className="h-[120px] rounded-md border border-white/10 p-2">
                                <div className="space-y-2">
                                    {subtasks.map((st, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white/5 p-2 rounded text-sm group">
                                            <span>{st.text}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeSubtask(index)}
                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    <DialogFooter className="pt-4 mt-auto">
                        <Button type="submit" className="w-full">Save Task</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
