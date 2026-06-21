"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Book, ArrowLeft, Loader2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDebouncedCallback } from 'use-debounce';

interface SearchResult {
    title: string;
    snippet: string;
    pageid: number;
}

interface ArticleSummary {
    title: string;
    extract: string;
    extract_html: string;
    thumbnail?: {
        source: string;
        width: number;
        height: number;
    };
    content_urls: {
        desktop: {
            page: string;
        };
    };
}

export function WikipediaTool() {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    type ViewMode = 'search' | 'summary' | 'full';
    const [viewMode, setViewMode] = useState<ViewMode>('search');
    
    const [selectedArticle, setSelectedArticle] = useState<ArticleSummary | null>(null);
    interface ParseArticleData {
        title: string;
        html: string;
    }
    const [fullArticleData, setFullArticleData] = useState<ParseArticleData | null>(null);
    const [isLoadingArticle, setIsLoadingArticle] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const searchWikipedia = useDebouncedCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        
        setIsSearching(true);
        try {
            const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&utf8=&format=json&origin=*`);
            const data = await res.json();
            if (data.query && data.query.search) {
                setSearchResults(data.query.search);
            }
        } catch (error) {
            console.error("Failed to search Wikipedia:", error);
        } finally {
            setIsSearching(false);
        }
    }, 500);

    useEffect(() => {
        searchWikipedia(query);
    }, [query, searchWikipedia]);

    const handleSelectArticle = async (title: string) => {
        setIsLoadingArticle(true);
        setSelectedArticle(null);
        setViewMode('summary');
        try {
            const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
            const data = await res.json();
            if (data.title && (data.extract || data.extract_html)) {
                setSelectedArticle(data);
            } else {
                setViewMode('search');
            }
        } catch (error) {
            console.error("Failed to fetch article summary:", error);
            setViewMode('search');
        } finally {
            setIsLoadingArticle(false);
        }
    };

    const handleFetchFullArticle = async (title: string) => {
        setIsLoadingArticle(true);
        try {
            const res = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`);
            const data = await res.json();
            if (data.parse && data.parse.text) {
                const htmlContent = typeof data.parse.text === 'string' 
                    ? data.parse.text 
                    : (data.parse.text['*'] || '');
                
                setFullArticleData({
                    title: data.parse.title || 'Article',
                    html: htmlContent
                });
                setViewMode('full');
            }
        } catch (error) {
            console.error("Failed to fetch full article:", error);
        } finally {
            setIsLoadingArticle(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col space-y-4 max-w-2xl mx-auto relative min-h-[70vh]">
            {/* Header Area */}
            <div className="flex flex-col gap-3">
                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <Book className="w-6 h-6 text-primary" />
                    Wikipedia
                </h1>
                
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        {isSearching ? (
                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        ) : (
                            <Search className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Search the world's knowledge..."
                        className="pl-10 bg-card border-border/50 focus-visible:ring-primary h-12 rounded-xl shadow-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                            if (selectedArticle) setSelectedArticle(null);
                        }}
                    />
                </div>
            </div>

            {/* Results or Article View */}
            <AnimatePresence mode="wait">
                {isLoadingArticle ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center p-12 space-y-4"
                    >
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm font-medium text-muted-foreground">Loading article...</p>
                    </motion.div>
                ) : viewMode === 'full' && fullArticleData ? (
                    <motion.div 
                        key="full-article"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="flex-1 space-y-4 pb-20"
                    >
                        <Button variant="ghost" size="sm" onClick={() => setViewMode('summary')} className="mb-2 gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4" /> Back to summary
                        </Button>

                        <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-md shadow-lg rounded-2xl">
                            {selectedArticle?.thumbnail ? (
                                <div className="w-full h-48 sm:h-64 relative bg-muted flex items-center justify-center overflow-hidden">
                                    <div 
                                        className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl scale-110" 
                                        style={{ backgroundImage: `url(${selectedArticle.thumbnail.source})` }} 
                                    />
                                    <img 
                                        src={selectedArticle.thumbnail.source} 
                                        alt={fullArticleData.title}
                                        className="relative h-full w-auto object-contain z-10 shadow-2xl"
                                    />
                                </div>
                            ) : null}
                            <CardContent className="p-6 sm:p-8">
                                <h1 
                                    className="text-4xl font-black text-foreground tracking-tight mb-6"
                                >
                                    {fullArticleData.title}
                                </h1>

                                <div className="prose prose-sm sm:prose-base dark:prose-invert prose-p:leading-relaxed prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80 max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: fullArticleData.html }} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : viewMode === 'summary' && selectedArticle ? (
                    <motion.div 
                        key="summary"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="flex-1 space-y-4 pb-20"
                    >
                        <Button variant="ghost" size="sm" onClick={() => setViewMode('search')} className="mb-2 gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4" /> Back to results
                        </Button>

                        <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-md shadow-lg rounded-2xl">
                            {selectedArticle.thumbnail ? (
                                <div className="w-full h-48 sm:h-64 relative bg-muted flex items-center justify-center overflow-hidden">
                                    <div 
                                        className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl scale-110" 
                                        style={{ backgroundImage: `url(${selectedArticle.thumbnail.source})` }} 
                                    />
                                    <img 
                                        src={selectedArticle.thumbnail.source} 
                                        alt={selectedArticle.title}
                                        className="relative h-full w-auto object-contain z-10 shadow-2xl"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                                    <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                                </div>
                            )}
                            
                            <CardContent className="p-6">
                                <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-4">{selectedArticle.title}</h2>
                                <div 
                                    className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-p:text-muted-foreground max-w-none"
                                    dangerouslySetInnerHTML={{ __html: selectedArticle.extract_html || selectedArticle.extract || 'No summary available.' }}
                                />
                                
                                <div className="mt-8 pt-6 border-t border-border/50 flex justify-end">
                                    <Button 
                                        variant="default" 
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl shadow-lg shadow-primary/20"
                                        onClick={() => handleFetchFullArticle(selectedArticle.title)}
                                    >
                                        <Book className="w-4 h-4" /> Read Full Article
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : searchResults.length > 0 ? (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-1 space-y-3 pb-20"
                    >
                        {searchResults.map((result) => (
                            <motion.div 
                                key={result.pageid}
                                layoutId={`result-${result.pageid}`}
                                onClick={() => handleSelectArticle(result.title)}
                                className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover:shadow-md cursor-pointer transition-all duration-200 group"
                            >
                                <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{result.title}</h3>
                                <p 
                                    className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : query.trim() !== '' && !isSearching ? (
                    <motion.div 
                        key="no-results"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                    >
                        <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-1">No results found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="empty"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-60"
                    >
                        <Book className="w-16 h-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-1">Wikipedia Search</h3>
                        <p className="text-sm text-muted-foreground max-w-[250px]">Look up any topic to read a quick summary directly in the app.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
