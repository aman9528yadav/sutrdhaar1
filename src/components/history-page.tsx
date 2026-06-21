"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Trash2, Search, History, Calculator,
  ArrowRightLeft, Star, Calendar, Clock, Copy,
  Sparkles, Filter, Languages
} from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { useProfile, HistoryItem, FavoriteItem, ConversionHistoryItem, CalculatorHistoryItem, DateCalculationHistoryItem, TranslationHistoryItem } from '@/context/ProfileContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const TAB_CONFIG = [
  { id: 'all', label: 'All', icon: History, color: 'text-primary', bg: 'bg-primary/10', active: 'bg-primary text-primary-foreground' },
  { id: 'conversion', label: 'Conversions', icon: ArrowRightLeft, color: 'text-blue-500', bg: 'bg-blue-500/10', active: 'bg-blue-500 text-white' },
  { id: 'calculator', label: 'Calculator', icon: Calculator, color: 'text-orange-500', bg: 'bg-orange-500/10', active: 'bg-orange-500 text-white' },
  { id: 'translation', label: 'Translation', icon: Languages, color: 'text-indigo-500', bg: 'bg-indigo-500/10', active: 'bg-indigo-500 text-white' },
  { id: 'favorites', label: 'Favorites', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10', active: 'bg-yellow-500 text-white' },
];

const TYPE_STYLES: Record<string, { icon: any; gradient: string; iconColor: string; label: string }> = {
  conversion: { icon: ArrowRightLeft, gradient: 'from-blue-500/20 to-cyan-500/10', iconColor: 'text-blue-500', label: 'Conversion' },
  favorite:   { icon: Star,           gradient: 'from-yellow-500/20 to-amber-500/10', iconColor: 'text-yellow-500', label: 'Favorite' },
  calculator: { icon: Calculator,     gradient: 'from-orange-500/20 to-red-500/10',  iconColor: 'text-orange-500', label: 'Calculation' },
  date_calculation: { icon: Calendar, gradient: 'from-purple-500/20 to-pink-500/10', iconColor: 'text-purple-500', label: 'Date Calc' },
  translation: { icon: Languages,     gradient: 'from-indigo-500/20 to-violet-500/10', iconColor: 'text-indigo-500', label: 'Translation' },
};

export function HistoryPage() {
  const { profile, clearAllHistory, clearAllFavorites, deleteHistoryItem, deleteFavorite } = useProfile();
  const { history, favorites } = profile;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const filteredItems = useMemo(() => {
    let items: (HistoryItem | FavoriteItem)[] = [];

    if (activeTab === 'favorites') {
      items = favorites;
    } else {
      items = history;
      if (activeTab !== 'all') {
        items = items.filter(item => item.type === activeTab);
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => {
        if (item.type === 'conversion' || item.type === 'favorite') {
          const i = item as ConversionHistoryItem | FavoriteItem;
          return i.fromValue.toLowerCase().includes(query) || i.toValue.toLowerCase().includes(query) || i.fromUnit.toLowerCase().includes(query) || i.toUnit.toLowerCase().includes(query) || i.category.toLowerCase().includes(query);
        } else if (item.type === 'calculator') {
          const i = item as CalculatorHistoryItem;
          return i.expression.toLowerCase().includes(query) || i.result.toLowerCase().includes(query);
        } else if (item.type === 'date_calculation') {
          const i = item as DateCalculationHistoryItem;
          return i.calculationType.toLowerCase().includes(query) || JSON.stringify(i.details).toLowerCase().includes(query);
        } else if (item.type === 'translation') {
          const i = item as TranslationHistoryItem;
          return i.sourceText.toLowerCase().includes(query) || i.translatedText.toLowerCase().includes(query);
        }
        return false;
      });
    }

    return items.sort((a, b) => {
      const timeA = (a as any).timestamp ? new Date((a as any).timestamp).getTime() : 0;
      const timeB = (b as any).timestamp ? new Date((b as any).timestamp).getTime() : 0;
      return timeB - timeA;
    });
  }, [history, favorites, activeTab, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: typeof filteredItems } = {};
    filteredItems.forEach(item => {
      const date = (item as any).timestamp ? parseISO((item as any).timestamp) : new Date();
      let key = 'Older';
      if (isToday(date)) key = 'Today';
      else if (isYesterday(date)) key = 'Yesterday';
      else if (isThisWeek(date)) key = 'This Week';
      else if (isThisMonth(date)) key = 'This Month';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    const orderedKeys = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
    return orderedKeys.filter(k => groups[k]).map(k => ({ title: k, items: groups[k] }));
  }, [filteredItems]);

  const handleClearAll = () => {
    if (activeTab === 'favorites') clearAllFavorites();
    else if (activeTab === 'all') clearAllHistory('all');
    else clearAllHistory(activeTab as any);
    toast({ title: "Cleared", description: "Items removed successfully." });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Copied to clipboard." });
  };

  const HistoryItemCard = ({ item }: { item: HistoryItem | FavoriteItem }) => {
    const isFav = activeTab === 'favorites';
    const style = TYPE_STYLES[item.type] ?? TYPE_STYLES.conversion;
    const Icon = style.icon;

    let title = '';
    let subtitle = '';

    if (item.type === 'conversion' || item.type === 'favorite') {
      const i = item as ConversionHistoryItem;
      title = `${i.fromValue} ${i.fromUnit}`;
      subtitle = `= ${i.toValue} ${i.toUnit}`;
    } else if (item.type === 'calculator') {
      const i = item as CalculatorHistoryItem;
      title = i.result;
      subtitle = i.expression;
    } else if (item.type === 'date_calculation') {
      const i = item as DateCalculationHistoryItem;
      if (i.calculationType === 'Difference' && i.details?.result) {
        title = `${i.details.result.years}Y ${i.details.result.months}M ${i.details.result.days}D`;
        subtitle = `${i.details.startDate.split(',')[0]} ➔ ${i.details.endDate.split(',')[0]}`;
      } else {
        title = i.calculationType;
        subtitle = 'Date Calculation';
      }
    } else if (item.type === 'translation') {
      const i = item as TranslationHistoryItem;
      title = i.translatedText;
      subtitle = `${i.sourceLang.toUpperCase()} ➔ ${i.targetLang.toUpperCase()} : ${i.sourceText}`;
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="group"
      >
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card/50 border border-border/40 hover:bg-accent/30 hover:border-border/70 transition-all duration-200 backdrop-blur-sm">
          {/* Icon */}
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br", style.gradient)}>
            <Icon className={cn("w-5 h-5", style.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate leading-tight">{title}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
          </div>

          {/* Meta + Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {(item as any).timestamp && (
              <span className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(parseISO((item as any).timestamp), 'h:mm a')}
              </span>
            )}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => copyToClipboard(title)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                onClick={() => isFav ? deleteFavorite(item.id) : deleteHistoryItem(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-24 px-1">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <History className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">History</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-10">Your calculations &amp; conversions</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 h-9 rounded-xl border border-destructive/20">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Clear
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear History?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all items in the current view. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll}>Delete All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center p-3 rounded-2xl bg-card/50 border border-border/40 backdrop-blur-sm">
          <span className="text-2xl font-extrabold text-foreground">{history.length}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Total</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <span className="text-2xl font-extrabold text-blue-500">{history.filter(h => h.type === 'conversion').length}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Conversions</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
          <span className="text-2xl font-extrabold text-yellow-500">{favorites.length}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Favorites</span>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 rounded-xl bg-card/50 border-border/50 text-sm"
        />
      </div>

      {/* ── Tab Filters ── */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {TAB_CONFIG.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 border",
                isActive
                  ? `${tab.active} border-transparent shadow-md`
                  : `${tab.bg} ${tab.color} border-border/40 hover:border-border`
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Items List ── */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {groupedItems.length > 0 ? (
            groupedItems.map(group => (
              <div key={group.title} className="space-y-2">
                {/* Date group header */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border/40" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{group.title}</span>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
                <div className="space-y-2">
                  {group.items.map(item => (
                    <HistoryItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-accent/50 border border-border/40 flex items-center justify-center mb-5">
                <Sparkles className="w-9 h-9 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Nothing here yet</h3>
              <p className="text-sm text-muted-foreground max-w-[220px]">
                {searchQuery ? 'Try different search terms.' : 'Start using tools and your history will show up here.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
