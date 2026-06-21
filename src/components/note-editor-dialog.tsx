"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useProfile, NoteItem } from '@/context/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Palette,
    Pin,
    Star,
    Trash2,
    Archive,
    Tag,
    X,
    MoreVertical,
    RotateCcw,
    Clock,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    CheckSquare,
    Heading,
    ArrowLeft,
    Save,
    Quote,
    Code,
    Link,
    Image,
    Table,
    Minus,
    Hash,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    IndentIncrease,
    IndentDecrease,
    Undo,
    Redo,
    Plus,
    MoreHorizontal,
    ChevronLeft,
    Highlighter,
    Sparkles,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { generateAIContent } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { hasUnlockedFeature } from '@/lib/level-system';

interface NoteEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    note?: NoteItem;
}

const colors = [
    { id: 'bg-card', class: 'bg-card', border: 'border-border' },
    { id: 'red', class: 'bg-red-500/10', border: 'border-red-500/20' },
    { id: 'orange', class: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { id: 'yellow', class: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { id: 'green', class: 'bg-green-500/10', border: 'border-green-500/20' },
    { id: 'teal', class: 'bg-teal-500/10', border: 'border-teal-500/20' },
    { id: 'blue', class: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'indigo', class: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { id: 'purple', class: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { id: 'pink', class: 'bg-pink-500/10', border: 'border-pink-500/20' },
];

export function NoteEditorDialog({ open, onOpenChange, note }: NoteEditorDialogProps) {
    const { profile, addNote, updateNote, deleteNote } = useProfile();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [color, setColor] = useState('bg-card');
    const [isFavorite, setIsFavorite] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [isArchived, setIsArchived] = useState(false);
    const [isTrashed, setIsTrashed] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [fontSize, setFontSize] = useState(16); // Base font size in pixels
    const [textAlignment, setTextAlignment] = useState('left'); // left, center, right, justify
    const [isAiLoading, setIsAiLoading] = useState(false);
    const { toast } = useToast();

    const editorRef = useRef<HTMLDivElement>(null);

    // Reset form when opening
    useEffect(() => {
        if (open) {
            setTitle(note?.title || '');
            setColor(note?.color || 'bg-card');
            setIsFavorite(note?.isFavorite || false);
            setIsPinned(note?.isPinned || false);
            setIsArchived(note?.isArchived || false);
            setIsTrashed(note?.isTrashed || false);
            setTags(note?.tags || []);
            setTagInput('');
            setFontSize(16);
            setTextAlignment('left');

            // Load HTML content into the editor directly to prevent cursor jumping
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.innerHTML = note?.content || '';
                }
            }, 10);
        }
    }, [open, note]);

    const handleSave = () => {
        const finalContent = editorRef.current?.innerHTML || '';
        
        if (!title.trim() && !finalContent.trim()) {
            onOpenChange(false);
            return;
        }

        const noteData = {
            title,
            content: finalContent,
            color,
            isFavorite,
            isPinned,
            isArchived,
            isTrashed,
            tags,
        };

        if (note) {
            updateNote({
                ...note,
                ...noteData,
            });
        } else {
            addNote(noteData);
        }
        onOpenChange(false);
    };

    const handleTrash = () => {
        if (note) {
            if (isTrashed) {
                if (confirm('Delete this note permanently?')) {
                    deleteNote(note.id);
                    onOpenChange(false);
                }
            } else {
                setIsTrashed(true);
                updateNote({ ...note, isTrashed: true });
                onOpenChange(false);
            }
        } else {
            onOpenChange(false);
        }
    };

    const handleRestore = () => {
        setIsTrashed(false);
        if (note) {
            updateNote({ ...note, isTrashed: false });
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const formatText = (command: string, value?: string) => {
        // Use native execCommand for WYSIWYG rich text
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(prev + 2, 24));
    };

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(prev - 2, 12));
    };

    const applyAlignment = (alignment: string) => {
        setTextAlignment(alignment);
        if (alignment === 'left') formatText('justifyLeft');
        if (alignment === 'center') formatText('justifyCenter');
        if (alignment === 'right') formatText('justifyRight');
        if (alignment === 'justify') formatText('justifyFull');
    };

    const handleAiSummarize = async () => {
        const noteText = editorRef.current?.innerText || '';
        if (!noteText.trim()) {
            toast({ title: "Empty Note", description: "There is nothing to summarize.", variant: "destructive" });
            return;
        }

        setIsAiLoading(true);
        try {
            const prompt = `Please provide a concise, bulleted summary of the following note:\n\n${noteText}`;
            const aiResponse = await generateAIContent(prompt, apiKey);
            
            // Format response into HTML
            const summaryHtml = `<div style="background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 16px; border-radius: 8px;"><strong>✨ AI Summary:</strong><br/>${aiResponse.replace(/\n/g, '<br/>')}</div><br/>`;
            
            if (editorRef.current) {
                editorRef.current.innerHTML = summaryHtml + editorRef.current.innerHTML;
            }
            toast({ title: "Note Summarized!", description: "Summary appended to the top." });
        } catch (error: any) {
            toast({ title: "AI Summarization Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleExportPDF = () => {
        if (!hasUnlockedFeature(profile, 'export_pdf')) {
            toast({ title: 'Feature Locked', description: 'Reach Level 4 to unlock Export to PDF', variant: 'destructive' });
            return;
        }
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${title || 'Note Export'}</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                            h1 { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
                        </style>
                    </head>
                    <body>
                        <h1>${title || 'Untitled Note'}</h1>
                        <div style="font-size: ${fontSize}px; text-align: ${textAlignment};">${editorRef.current?.innerHTML || ''}</div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const currentColorObj = colors.find(c => c.class === color) || colors[0];

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleSave();
            onOpenChange(val);
        }}>
            <DialogContent className={cn(
                "w-full h-[100dvh] max-w-[412px] p-0 gap-0 border-0 shadow-none flex flex-col [&>button]:hidden", // Locked to mobile size
                color
            )}>
                {/* Apple Notes Style Header */}
                <div className="flex items-center justify-between px-2 py-3 bg-background/90 backdrop-blur-xl shrink-0 border-b border-border/30">
                    <Button variant="ghost" onClick={handleSave} className="text-primary hover:bg-primary/10 gap-1 px-2 text-lg font-normal">
                        <ChevronLeft className="h-6 w-6 -ml-1" />
                        Notes
                    </Button>

                    <div className="flex items-center gap-1 pr-2">
                        <Button 
                            variant="ghost" 
                            className="text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 gap-1 px-3 h-10 rounded-full" 
                            onClick={handleAiSummarize}
                            disabled={isAiLoading}
                            title="AI Summarize"
                        >
                            {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        </Button>
                        <Button variant="ghost" className="text-primary hover:bg-primary/10 font-medium text-lg px-3" onClick={handleSave}>
                            Done
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 h-10 w-10 rounded-full">
                                    <MoreHorizontal className="h-6 w-6" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl">
                                <div className="px-2 pb-2 mb-2 border-b border-border/50">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Options</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => setIsPinned(!isPinned)} className={cn("h-10 w-10 rounded-xl bg-accent/50", isPinned && "bg-primary/10 text-primary")}>
                                            <Pin className={cn("h-5 w-5", isPinned && "fill-current")} />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setIsFavorite(!isFavorite)} className={cn("h-10 w-10 rounded-xl bg-accent/50", isFavorite && "bg-yellow-500/10 text-yellow-500")}>
                                            <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setIsArchived(!isArchived)} className={cn("h-10 w-10 rounded-xl bg-accent/50", isArchived && "bg-primary/10 text-primary")}>
                                            <Archive className={cn("h-5 w-5", isArchived && "fill-current")} />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={handleTrash} className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors">
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-border/50">
                                        <Button variant="ghost" onClick={handleExportPDF} className="w-full justify-start text-sm">
                                            Export to PDF
                                        </Button>
                                    </div>
                                </div>

                                <div className="px-2 pb-2 mb-2 border-b border-border/50">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Background Color</p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {colors.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => setColor(c.class)}
                                                className={cn(
                                                    "w-8 h-8 rounded-full border border-border transition-transform hover:scale-110 shadow-sm",
                                                    c.class,
                                                    color === c.class && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                                )}
                                                title={c.id}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="px-2 pb-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
                                    <div className="flex items-center gap-2 bg-accent/50 rounded-xl p-1 px-2">
                                        <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <Input
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            placeholder="Add tag & enter..."
                                            className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 px-1"
                                        />
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2" style={{ fontSize: `${fontSize}px` }}>
                    {/* Tags Display */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pb-2">
                            {tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="bg-black/10 hover:bg-black/20 text-foreground/80 gap-1 pr-1">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Title Input */}
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        className="text-[32px] font-bold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-muted-foreground/30 h-auto py-1"
                    />

                    {/* Timestamp */}
                    <div className="text-[13px] text-muted-foreground/60 font-medium px-0 pb-4">
                        {note ? `Last edited ${formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}` : formatDistanceToNow(Date.now(), { addSuffix: true })}
                    </div>

                    {/* Content Editor */}
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        placeholder="Notes"
                        className="min-h-[50vh] outline-none border-none shadow-none focus-visible:ring-0 px-0 bg-transparent leading-[1.6] empty:before:content-[attr(placeholder)] empty:before:text-muted-foreground/40 cursor-text"
                        style={{ textAlign: textAlignment as any, fontSize: `${fontSize}px` }}
                    />
                </div>

                {/* Mobile Formatting Toolbar (Keyboard Accessory Style) */}
                <div className="shrink-0 border-t border-border/30 bg-background/95 backdrop-blur-xl pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div className="w-full overflow-x-auto scrollbar-hide">
                        <div className="flex items-center gap-2 p-2 min-w-max">
                            {/* Text Formatting */}
                            <div className="flex bg-accent/50 rounded-xl p-1">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background" onMouseDown={(e) => { e.preventDefault(); formatText('bold'); }}>
                                    <Bold className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background" onMouseDown={(e) => { e.preventDefault(); formatText('italic'); }}>
                                    <Italic className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background" onMouseDown={(e) => { e.preventDefault(); formatText('underline'); }}>
                                    <Underline className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background" onMouseDown={(e) => { e.preventDefault(); formatText('strikethrough'); }}>
                                    <Strikethrough className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Color & Highlight */}
                            <div className="flex bg-accent/50 rounded-xl p-1 items-center gap-1 px-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background text-primary" title="Text Color">
                                            <Palette className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center" className="p-2 min-w-0 flex gap-1 rounded-xl shadow-xl">
                                        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ffffff', '#000000'].map(c => (
                                            <button key={c} onMouseDown={(e) => { e.preventDefault(); formatText('foreColor', c); }} className="w-6 h-6 rounded-full border border-border/50 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background text-yellow-500" title="Highlight">
                                            <Highlighter className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center" className="p-2 min-w-0 flex gap-1 rounded-xl shadow-xl">
                                        {['#fef08a', '#fecaca', '#bfdbfe', '#bbf7d0', '#e9d5ff', 'transparent'].map(c => (
                                            <button key={c} onMouseDown={(e) => { e.preventDefault(); formatText('hiliteColor', c === 'transparent' ? 'transparent' : c); }} className="w-6 h-6 rounded-full border border-border/50 hover:scale-110 transition-transform flex items-center justify-center relative" style={{ backgroundColor: c }}>
                                                {c === 'transparent' && <div className="absolute w-[120%] h-0.5 bg-red-500 rotate-45" />}
                                            </button>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Font Size */}
                            <div className="flex bg-accent/50 rounded-xl p-1 items-center">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background text-lg font-bold" onMouseDown={(e) => { e.preventDefault(); decreaseFontSize(); }} title="Decrease Size">
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background text-lg font-bold" onMouseDown={(e) => { e.preventDefault(); increaseFontSize(); }} title="Increase Size">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Structure & Checklist */}
                            <div className="flex bg-accent/50 rounded-xl p-1">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background" onMouseDown={(e) => { e.preventDefault(); formatText('formatBlock', 'H1'); }} title="Heading">
                                    <Heading className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background" onMouseDown={(e) => { e.preventDefault(); formatText('insertText', '☐ '); }} title="Checklist">
                                    <CheckSquare className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background" onMouseDown={(e) => { e.preventDefault(); formatText('insertUnorderedList'); }} title="Bullet List">
                                    <List className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background" onMouseDown={(e) => { e.preventDefault(); formatText('insertOrderedList'); }} title="Numbered List">
                                    <Hash className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Alignment */}
                            <div className="flex bg-accent/50 rounded-xl p-1">
                                <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-lg hover:bg-background", textAlignment === 'left' && "bg-background shadow-sm")} onMouseDown={(e) => { e.preventDefault(); applyAlignment('left'); }}>
                                    <AlignLeft className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-lg hover:bg-background", textAlignment === 'center' && "bg-background shadow-sm")} onMouseDown={(e) => { e.preventDefault(); applyAlignment('center'); }}>
                                    <AlignCenter className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-lg hover:bg-background", textAlignment === 'right' && "bg-background shadow-sm")} onMouseDown={(e) => { e.preventDefault(); applyAlignment('right'); }}>
                                    <AlignRight className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Link */}
                            <div className="flex bg-accent/50 rounded-xl p-1">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-background text-primary" onMouseDown={(e) => {
                                    e.preventDefault();
                                    const url = prompt('Enter link URL:');
                                    if (url) formatText('createLink', url);
                                }}>
                                    <Link className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
