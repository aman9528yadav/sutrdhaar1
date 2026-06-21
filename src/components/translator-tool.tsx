"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowRightLeft,
  Copy,
  Volume2,
  Mic,
  MicOff,
  History,
  RotateCcw,
  Loader2,
  Languages,
  X,
  BookA,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfile, TranslationHistoryItem } from '@/context/ProfileContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAIContent } from '@/lib/ai';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
];

interface DictionaryEntry {
  pos: string;
  terms: string[];
}

export function TranslatorTool() {
  const { toast } = useToast();
  const { profile, addTranslationToHistory, deleteHistoryItem } = useProfile();
  
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[]>([]);
  const [transliteration, setTransliteration] = useState('');
  const [examples, setExamples] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // STT Recognition instance
  const [recognition, setRecognition] = useState<any>(null);

  const translationHistory = (profile.history?.filter(h => h.type === 'translation') || []) as TranslationHistoryItem[];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSourceText(prev => (prev + ' ' + transcript).trim());
        };
        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          toast({ title: "Microphone Error", description: "Could not access microphone.", variant: "destructive" });
        };
        rec.onend = () => {
          setIsListening(false);
        };
        setRecognition(rec);
      }
    }
  }, [toast]);

  // No auto-translate, manual only

  const handleTranslate = async (text: string) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setDictionaryData([]); // Clear previous dictionary data
    setTransliteration('');
    setExamples([]);

    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&dt=bd&dt=ex&dt=rm&q=${encodeURIComponent(text)}`);
      const data = await response.json();
      
      if (data && data[0]) {
        // Translation text
        const result = data[0].filter((item: any) => item[0] !== null).map((item: any) => item[0]).join('');
        setTranslatedText(result);

        // Transliteration (usually last item in data[0] if it starts with null)
        const lastPart = data[0][data[0].length - 1];
        if (lastPart && lastPart[0] === null && lastPart[1] === null && lastPart[2]) {
          setTransliteration(lastPart[2]);
        }

        // Example sentences
        const exNode = data.find((item: any) => Array.isArray(item) && Array.isArray(item[0]) && Array.isArray(item[0][0]) && typeof item[0][0][0] === 'string' && item[0][0][0].includes('<b>'));
        if (exNode) {
          const extractedExamples = exNode[0].map((ex: any) => ex[0].replace(/<\/?b>/g, ''));
          setExamples(extractedExamples);
        }

        // Parse dictionary data if available
        if (data[1] && Array.isArray(data[1])) {
          const dict: DictionaryEntry[] = data[1].map((item: any[]) => ({
            pos: item[0],
            terms: item[1] || []
          }));
          setDictionaryData(dict);
        }
        
        // Add to history
        addTranslationToHistory({
          sourceText: text,
          translatedText: result,
          sourceLang,
          targetLang
        });
      } else {
        throw new Error('Invalid response from translation API');
      }
    } catch (error) {
      console.error("Translation failed:", error);
      toast({ title: "Translation Failed", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiAction = async (action: 'grammar' | 'professional' | 'casual') => {
    if (!sourceText.trim()) return;

    setIsAiLoading(true);
    let prompt = "";
    if (action === 'grammar') {
      prompt = `Fix the grammar and spelling of the following text, keeping the original language and meaning intact. Only return the corrected text without any extra explanation:\n\n${sourceText}`;
    } else if (action === 'professional') {
      prompt = `Rewrite the following text to sound extremely professional, polite, and formal. Keep the original language. Only return the rewritten text without any extra explanation:\n\n${sourceText}`;
    } else if (action === 'casual') {
      prompt = `Rewrite the following text to sound casual, friendly, and natural. Keep the original language. Only return the rewritten text without any extra explanation:\n\n${sourceText}`;
    }

    try {
      const aiResponse = await generateAIContent(prompt, profile.settings.geminiApiKey);
      setSourceText(aiResponse.trim());
      toast({ title: "AI Magic Applied!", description: "Your text has been updated." });
    } catch (error: any) {
      toast({ title: "AI Request Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSwap = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    
    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
    
    // Clear supplementary data on swap
    setTransliteration('');
    setExamples([]);
    setDictionaryData([]);
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const handleSpeak = (text: string, langCode: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognition) {
      toast({ title: "Not Supported", description: "Speech recognition is not supported in this browser.", variant: "destructive" });
      return;
    }
    
    if (isListening) {
      recognition.stop();
    } else {
      recognition.lang = sourceLang;
      recognition.start();
      setIsListening(true);
    }
  };

  const handleRestoreHistory = (item: TranslationHistoryItem) => {
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    setTransliteration('');
    setExamples([]);
    setDictionaryData([]);
  };

  return (
    <div className="space-y-6 pb-6 max-w-4xl mx-auto w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
            Translator
          </h1>
          <p className="text-muted-foreground mt-1">Translate text & voice instantly</p>
        </div>
      </div>

      <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Box */}
        <Card className="bg-card/50 border-border/50 shadow-sm rounded-3xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/30 bg-muted/20 flex justify-between items-center">
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger className="w-[180px] bg-transparent border-none shadow-none text-base font-semibold focus:ring-0">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("rounded-full h-9 w-9", isListening && "text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600")}
                onClick={toggleListening}
              >
                {isListening ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => handleSpeak(sourceText, sourceLang)}>
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => setSourceText('')}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10">
                    {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border-border/50">
                  <DropdownMenuItem onClick={() => handleAiAction('grammar')} disabled={isAiLoading || !sourceText.trim()}>
                    <Sparkles className="w-4 h-4 mr-2 text-amber-500" /> Fix Grammar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('professional')} disabled={isAiLoading || !sourceText.trim()}>
                    <BookA className="w-4 h-4 mr-2 text-blue-500" /> Make Professional
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('casual')} disabled={isAiLoading || !sourceText.trim()}>
                    <Languages className="w-4 h-4 mr-2 text-emerald-500" /> Make Casual
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardContent className="p-0 flex-1 relative group flex flex-col">
            <Textarea 
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Type or paste text here..."
              className="flex-1 min-h-[200px] border-none shadow-none resize-none focus-visible:ring-0 p-5 text-lg md:text-xl bg-transparent"
            />
          </CardContent>
        </Card>

        {/* Swap Button (Mobile) */}
        <div className="flex md:hidden justify-center -my-6 relative z-10">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-card shadow-lg border-border h-12 w-12 hover:scale-110 transition-transform"
            onClick={handleSwap}
          >
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </Button>
        </div>

        {/* Target Box */}
        <Card className="bg-card/50 border-border/50 shadow-sm rounded-3xl overflow-hidden flex flex-col relative">
          <div className="p-4 border-b border-border/30 bg-muted/20 flex justify-between items-center">
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="w-[180px] bg-transparent border-none shadow-none text-base font-semibold focus:ring-0 text-primary">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => handleSpeak(translatedText, targetLang)}>
                <Volume2 className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => handleCopy(translatedText)}>
                <Copy className="h-4 w-4 text-primary" />
              </Button>
            </div>
          </div>
          <CardContent className="p-0 flex-1 bg-primary/5">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            <Textarea 
              value={translatedText}
              readOnly
              placeholder="Translation will appear here..."
              className="flex-1 min-h-[160px] border-none shadow-none resize-none focus-visible:ring-0 p-5 text-lg md:text-xl font-medium text-foreground bg-transparent"
            />
            {transliteration && (
              <div className="px-5 pb-5 pt-0">
                <span className="text-sm font-semibold text-primary/80 bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  {transliteration}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Swap Button (Desktop) */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none justify-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-card shadow-xl border-border h-12 w-12 hover:scale-110 transition-transform pointer-events-auto"
            onClick={handleSwap}
          >
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </Button>
        </div>
      </div>

      <Button 
        onClick={() => handleTranslate(sourceText)} 
        className="w-full rounded-2xl h-14 text-lg font-semibold shadow-lg shadow-primary/20 mt-2"
        disabled={isLoading || !sourceText.trim()}
      >
        {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Languages className="w-5 h-5 mr-2" />}
        Translate
      </Button>

      {/* Dictionary Card */}
      {dictionaryData.length > 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Card className="bg-card/50 border-border/50 shadow-sm rounded-3xl overflow-hidden mt-4">
              <div className="p-4 border-b border-border/30 bg-muted/20 flex items-center gap-2">
                <BookA className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-lg">Dictionary</h3>
              </div>
              <CardContent className="p-5 space-y-4">
                {dictionaryData.map((entry, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="inline-block px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                      {entry.pos}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entry.terms.map((term, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-accent/50 border border-border/50 text-sm text-foreground">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Examples Card */}
      {examples.length > 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Card className="bg-card/50 border-border/50 shadow-sm rounded-3xl overflow-hidden mt-4">
              <div className="p-4 border-b border-border/30 bg-muted/20 flex items-center gap-2">
                <Languages className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-foreground text-lg">Examples</h3>
              </div>
              <CardContent className="p-5 space-y-3">
                <ul className="space-y-3">
                  {examples.slice(0, 5).map((ex, idx) => (
                    <li key={idx} className="text-foreground/90 flex items-start gap-2">
                      <span className="text-indigo-500 font-bold mt-0.5">•</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* In-Line History Tape */}
      {translationHistory.length > 0 && (
        <div className="w-full overflow-x-auto no-scrollbar py-2 mt-4 flex justify-start mask-edges">
           <div className="flex gap-3 w-max items-center px-2 pt-2">
             {translationHistory.slice(0, 10).map(item => (
               <div key={item.id} className="relative group/chip shrink-0">
                 <button
                   onClick={() => handleRestoreHistory(item)}
                   className="px-4 py-2 rounded-xl bg-card border border-border/50 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all w-full flex flex-col items-start gap-1 max-w-[200px] shadow-sm"
                   title={`${item.sourceText} -> ${item.translatedText}`}
                 >
                   <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 w-full">
                      <Languages className="w-3 h-3" />
                      <span>{item.sourceLang} ➔ {item.targetLang}</span>
                   </div>
                   <span className="font-semibold text-foreground truncate w-full text-left">{item.sourceText}</span>
                   <span className="text-primary font-medium truncate w-full text-left">{item.translatedText}</span>
                 </button>
                 <Button
                   variant="ghost"
                   size="icon"
                   className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border shadow-sm opacity-0 group-hover/chip:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all scale-75 group-hover/chip:scale-100"
                   onClick={(e) => {
                     e.stopPropagation();
                     deleteHistoryItem(item.id);
                   }}
                 >
                   <X className="h-3 w-3" />
                 </Button>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
