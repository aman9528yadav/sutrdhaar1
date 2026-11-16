"use client";

import React, { useState, useMemo } from 'react';
import { useProfile, NoteItem } from '@/context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Star,
    Pin,
    Archive,
    Trash2,
    Menu,
    Grid,
    List,
    Tag,
    StickyNote,
    X,
    MoreVertical,
    RotateCcw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NoteEditorDialog } from './note-editor-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useSearchParams, useRouter } from 'next/navigation';

type ViewType = 'notes' | 'favorites' | 'archive' | 'trash' | string; // string for tag views

export function NotesPage() {
    const { profile, updateNote, deleteNote } = useProfile();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState<NoteItem | undefined>(undefined);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [currentView, setCurrentView] = useState<ViewType>('notes');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');

    const searchParams = useSearchParams();
    const router = useRouter();

    // Open note from URL param
    React.useEffect(() => {
        const noteId = searchParams.get('id');
        if (noteId && profile.notes) {
            const note = profile.notes.find(n => n.id === noteId);
            if (note) {
                setSelectedNote(note);
                setIsEditorOpen(true);
            }
        }
    }, [searchParams, profile.notes]);

    const handleEditorOpenChange = (open: boolean) => {
        setIsEditorOpen(open);
        if (!open) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('id');
            router.replace(`?${params.toString()}`, { scroll: false });
            setSelectedNote(undefined);
        }
    };

    // Extract all unique tags
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        profile.notes.forEach(note => {
            if (!note.isTrashed) {
                note.tags?.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, [profile.notes]);

    // Filter notes based on view and search
    const filteredNotes = useMemo(() => {
        let notes = profile.notes;

        // 1. Filter by View
        if (currentView === 'notes') {
            notes = notes.filter(n => !n.isTrashed && !n.isArchived);
        } else if (currentView === 'favorites') {
            notes = notes.filter(n => !n.isTrashed && n.isFavorite);
        } else if (currentView === 'archive') {
            notes = notes.filter(n => !n.isTrashed && n.isArchived);
        } else if (currentView === 'trash') {
            notes = notes.filter(n => n.isTrashed);
        } else {
            // Tag view
            notes = notes.filter(n => !n.isTrashed && n.tags?.includes(currentView));
        }

        // 2. Filter by Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            notes = notes.filter(n =>
                n.title.toLowerCase().includes(query) ||
                n.content.toLowerCase().includes(query) ||
                n.tags?.some(t => t.toLowerCase().includes(query))
            );
        }

        // 3. Sort: Pinned first, then updated date
        return notes.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    }, [profile.notes, currentView, searchQuery]);

    const handleCreateNote = () => {
        setSelectedNote(undefined);
        setIsEditorOpen(true);
    };

    const handleEditNote = (note: NoteItem) => {
        setSelectedNote(note);
        setIsEditorOpen(true);
    };

    const handleRestore = (note: NoteItem, e: React.MouseEvent) => {
        e.stopPropagation();
        updateNote({ ...note, isTrashed: false });
    };

    const handleDeleteForever = (note: NoteItem, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this note permanently?')) {
            deleteNote(note.id);
        }
    };

    const tabs = [
        { id: 'notes', label: 'Notes', icon: StickyNote },
        { id: 'favorites', label: 'Favorites', icon: Star },
        { id: 'archive', label: 'Archive', icon: Archive },
        { id: 'trash', label: 'Trash', icon: Trash2 },
        ...allTags.map(tag => ({ id: tag, label: tag, icon: Tag }))
    ];

    return (
        <div className="space-y-4 min-h-screen flex flex-col pb-20 max-w-4xl mx-auto w-full pt-2 relative">
            {/* Samsung Notes Style Header */}
            <div className="flex items-center justify-between shrink-0 mb-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-3xl font-bold p-0 h-auto hover:bg-transparent text-foreground flex items-center gap-2">
                            {currentView === 'notes' ? 'All notes' : currentView.charAt(0).toUpperCase() + currentView.slice(1)}
                            <Menu className="h-6 w-6 text-muted-foreground ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 rounded-2xl shadow-xl p-2 border-border/50 bg-background/95 backdrop-blur-xl">
                        {tabs.map((tab) => (
                            <DropdownMenuItem 
                                key={tab.id}
                                onClick={() => setCurrentView(tab.id)}
                                className={cn(
                                    "rounded-xl py-2.5 px-3 mb-1 cursor-pointer",
                                    currentView === tab.id ? "bg-primary/10 text-primary font-medium" : ""
                                )}
                            >
                                <tab.icon className="mr-3 h-5 w-5 opacity-70" />
                                {tab.label}
                                {tab.id === 'notes' && (
                                    <span className="ml-auto text-xs font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                        {profile.notes.filter(n => !n.isTrashed && !n.isArchived).length}
                                    </span>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleCreateNote} className="rounded-full h-10 w-10 text-primary hover:bg-black/5 dark:hover:bg-white/10" title="New Note">
                        <Plus className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10">
                        <Search className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-1">
                            <DropdownMenuItem className="rounded-xl py-2" onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}>
                                {layout === 'grid' ? <List className="mr-2 h-4 w-4" /> : <Grid className="mr-2 h-4 w-4" />}
                                View as {layout === 'grid' ? 'List' : 'Grid'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Notes Grid/List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide -mx-4 px-4">
                {filteredNotes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 pt-20">
                        <div className="p-6 rounded-full bg-accent/30">
                            {currentView === 'trash' ? <Trash2 className="h-10 w-10 opacity-40" /> :
                                currentView === 'archive' ? <Archive className="h-10 w-10 opacity-40" /> :
                                    currentView === 'favorites' ? <Star className="h-10 w-10 opacity-40" /> :
                                        <StickyNote className="h-10 w-10 opacity-40" />}
                        </div>
                        <p className="text-lg font-medium">No notes</p>
                    </div>
                ) : (
                    <div className={cn(
                        "w-full pb-32 gap-4",
                        layout === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "flex flex-col space-y-3"
                    )}>
                        <AnimatePresence>
                            {filteredNotes.map(note => (
                                <motion.div
                                    key={note.id}
                                    layoutId={`note-${note.id}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full"
                                >
                                    <NoteCard
                                        note={note}
                                        onClick={() => handleEditNote(note)}
                                        isTrashed={currentView === 'trash'}
                                        onRestore={(e) => handleRestore(note, e)}
                                        onDeleteForever={(e) => handleDeleteForever(note, e)}
                                        layout={layout}
                                        onTogglePin={(e) => { e.stopPropagation(); updateNote({ ...note, isPinned: !note.isPinned }); }}
                                        onToggleFavorite={(e) => { e.stopPropagation(); updateNote({ ...note, isFavorite: !note.isFavorite }); }}
                                        onTrash={(e) => { e.stopPropagation(); updateNote({ ...note, isTrashed: true }); }}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Samsung Style FAB */}
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-[100px] right-6 sm:absolute sm:bottom-6 sm:right-6 z-50"
            >
                <Button 
                    onClick={handleCreateNote} 
                    className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center p-0"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </motion.div>

            <NoteEditorDialog
                open={isEditorOpen}
                onOpenChange={handleEditorOpenChange}
                note={selectedNote}
            />
        </div>
    );
}

function NoteCard({
    note,
    onClick,
    isTrashed,
    onRestore,
    onDeleteForever,
    layout,
    onTogglePin,
    onToggleFavorite,
    onTrash
}: {
    note: NoteItem;
    onClick: () => void;
    isTrashed?: boolean;
    onRestore?: (e: React.MouseEvent) => void;
    onDeleteForever?: (e: React.MouseEvent) => void;
    onTogglePin?: (e: React.MouseEvent) => void;
    onToggleFavorite?: (e: React.MouseEvent) => void;
    onTrash?: (e: React.MouseEvent) => void;
    layout?: 'grid' | 'list';
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-[24px] border border-transparent transition-all duration-200 cursor-pointer",
                note.color && note.color !== 'bg-card' ? note.color : "bg-card shadow-sm dark:bg-[#1C1C1E]",
                layout === 'list' && "flex items-center min-h-[90px] py-2"
            )}
        >
            <div className={cn("p-5 flex-1", layout === 'list' ? "space-y-1" : "space-y-3")}>
                <div className="flex items-start justify-between gap-2">
                    <h3 className={cn("font-semibold text-lg leading-tight text-foreground/90", !note.title && "text-muted-foreground font-normal italic")}>
                        {note.title || 'Untitled note'}
                    </h3>
                    <div className="flex shrink-0 gap-1 mt-1">
                        {note.isPinned && <Pin className="h-4 w-4 fill-primary/20 text-primary" />}
                        {note.isFavorite && <Star className="h-4 w-4 fill-yellow-500/20 text-yellow-500" />}
                    </div>
                </div>

                {note.content && (
                    <div 
                        className={cn(
                            "text-[15px] text-muted-foreground leading-relaxed",
                            layout === 'list' ? "line-clamp-1 text-sm mt-0" : "line-clamp-6"
                        )}
                        dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                )}

                <div className={cn(
                    "flex items-center justify-between text-xs text-muted-foreground/60 font-medium",
                    layout === 'list' ? "absolute right-5 bottom-6" : "pt-2"
                )}>
                    <span>{format(new Date(note.updatedAt), 'MMM d, yyyy')}</span>
                </div>
            </div>

            {isTrashed ? (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur-md rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onRestore} title="Restore">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" onClick={onDeleteForever} title="Delete Forever">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur-md rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full", note.isPinned && "text-primary")} onClick={onTogglePin} title={note.isPinned ? "Unpin" : "Pin"}>
                        <Pin className={cn("h-4 w-4", note.isPinned && "fill-current")} />
                    </Button>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full", note.isFavorite && "text-yellow-500")} onClick={onToggleFavorite} title={note.isFavorite ? "Unfavorite" : "Favorite"}>
                        <Star className={cn("h-4 w-4", note.isFavorite && "fill-current")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/20" onClick={onTrash} title="Delete">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
