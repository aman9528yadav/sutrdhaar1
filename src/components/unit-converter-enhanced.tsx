"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRightLeft,
    Star,
    Copy,
    Info,
    Power,
    ChevronDown,
    ChevronUp,
    Download,
    Calculator,
    Settings2,
    Table,
    Lock,
    Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
} from '@/components/ui/collapsible';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CATEGORIES, convert, getConversionFormula, Unit } from '@/lib/units';
import { useToast } from '@/hooks/use-toast';
import { cn, formatIndianNumber } from '@/lib/utils';

import { useProfile, ConversionHistoryItem } from '@/context/ProfileContext';
import { ConversionComparisonDialog } from './conversion-comparison-dialog';
import { hasUnlockedFeature } from '@/lib/level-system';

const advancedCategories = ['Pressure', 'Data', 'Power', 'Force', 'Currency'];

export function UnitConverterEnhanced() {
    const { toast } = useToast();
    const { profile, addConversionToHistory, addFavorite, deleteFavorite, addXP } = useProfile();
    const { history, favorites } = profile;

    // Basic state
    const [region, setRegion] = useState('International');
    const [category, setCategory] = useState(CATEGORIES[0].name);
    const [inputValue, setInputValue] = useState('1');
    const [fromUnit, setFromUnit] = useState(CATEGORIES[0].units[0].name);
    const [toUnit, setToUnit] = useState(CATEGORIES[0].units[1].name);
    const [result, setResult] = useState('');
    const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);

    // Enhanced features state
    const [precision, setPrecision] = useState(5);
    const [showFormula, setShowFormula] = useState(false);
    const [showAllConversions, setShowAllConversions] = useState(false);
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkInput, setBulkInput] = useState('');
    const [bulkResults, setBulkResults] = useState<Array<{ input: string; output: string }>>([]);

    const [liveRates, setLiveRates] = useState<Record<string, number> | null>(null);
    const [isLiveRatesLoading, setIsLiveRatesLoading] = useState(false);

    const isAdvancedUnlocked = hasUnlockedFeature(profile, 'advanced_converter');

    const activeCategory = useMemo(
        () => CATEGORIES.find((c) => c.name === category)!,
        [category]
    );

    const units = useMemo(() => {
        if (region === 'Local') {
            return activeCategory.units.filter(u => !u.region || u.region === 'Indian');
        }
        return activeCategory.units.filter(u => !u.region);
    }, [activeCategory, region]);

    const fromUnitDetails = useMemo(() => units.find(u => u.name === fromUnit), [units, fromUnit]);
    const toUnitDetails = useMemo(() => units.find(u => u.name === toUnit), [units, toUnit]);

    const isFavorited = useMemo(() => {
        return favorites.some(fav => fav.category === category && fav.fromUnit === fromUnit && fav.toUnit === toUnit);
    }, [favorites, category, fromUnit, toUnit]);

    const formula = useMemo(() => {
        return getConversionFormula(fromUnit, toUnit, category, liveRates || undefined);
    }, [fromUnit, toUnit, category, liveRates]);

    const allConversions = useMemo(() => {
        const value = parseFloat(inputValue);
        if (isNaN(value)) return [];

        return units.map(unit => {
            const convertedValue = convert(value, fromUnit, unit.name, category, liveRates || undefined);
            if (convertedValue !== null) {
                const formatted = Number(convertedValue.toPrecision(precision));
                return {
                    unit: unit.name,
                    symbol: unit.symbol,
                    value: formatted,
                    isStandard: unit.isStandard,
                };
            }
            return null;
        }).filter(Boolean) as Array<{ unit: string; symbol: string; value: number; isStandard?: boolean }>;
    }, [inputValue, fromUnit, category, units, precision, liveRates]);

    const handleConversion = useCallback((valueStr?: string) => {
        const valueToConvert = valueStr || inputValue;
        const value = parseFloat(valueToConvert);
        if (isNaN(value)) {
            setResult('');
            return;
        }
        const convertedValue = convert(value, fromUnit, toUnit, category, liveRates || undefined);
        if (convertedValue !== null) {
            const formattedResult = Number(convertedValue.toPrecision(precision));
            setResult(formattedResult.toString());
            return {
                fromValue: valueToConvert,
                fromUnit,
                toValue: formattedResult.toString(),
                toUnit,
                category,
            };
        } else {
            setResult('N/A');
        }
        return null;
    }, [inputValue, fromUnit, toUnit, category, precision, liveRates]);

    const handleBulkConversion = useCallback(() => {
        const values = bulkInput.split(',').map(v => v.trim()).filter(v => v);
        const results = values.map(val => {
            const num = parseFloat(val);
            if (isNaN(num)) {
                return { input: val, output: 'Invalid' };
            }
            const converted = convert(num, fromUnit, toUnit, category, liveRates || undefined);
            if (converted !== null) {
                const formatted = Number(converted.toPrecision(precision));
                return { input: val, output: formatted.toString() };
            }
            return { input: val, output: 'N/A' };
        });
        setBulkResults(results);
    }, [bulkInput, fromUnit, toUnit, category, precision, liveRates]);

    const exportBulkToCSV = useCallback(() => {
        if (bulkResults.length === 0) {
            toast({
                title: "No data to export",
                description: "Convert some values first!",
                variant: "destructive",
            });
            return;
        }

        let csv = `Input (${fromUnit}),Output (${toUnit})\n`;
        bulkResults.forEach(result => {
            csv += `${result.input},${result.output}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-conversion-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
            title: "Exported! 📊",
            description: "Bulk conversion data saved to CSV",
        });
    }, [bulkResults, fromUnit, toUnit, toast]);

    const copyAllConversions = useCallback(() => {
        const text = allConversions.map(c =>
            `${inputValue} ${fromUnitDetails?.symbol} = ${c.value} ${c.symbol}`
        ).join('\n');

        navigator.clipboard.writeText(text);
        toast({
            title: "Copied! 📋",
            description: "All conversions copied to clipboard",
        });
    }, [allConversions, inputValue, fromUnitDetails, toast]);

    useEffect(() => {
        if (!units.find(u => u.name === fromUnit)) {
            setFromUnit(units[0].name);
        }
        if (!units.find(u => u.name === toUnit)) {
            setToUnit(units[1]?.name || units[0].name);
        }
    }, [units, fromUnit, toUnit]);

    useEffect(() => {
        handleConversion();
    }, [inputValue, fromUnit, toUnit, category, precision, handleConversion]);

    useEffect(() => {
        if (bulkMode && bulkInput) {
            handleBulkConversion();
        }
    }, [bulkMode, bulkInput, fromUnit, toUnit, precision, handleBulkConversion]);

    useEffect(() => {
        if (category === 'Currency') {
            const fetchRates = async () => {
                setIsLiveRatesLoading(true);
                try {
                    const res = await fetch('https://open.er-api.com/v6/latest/USD');
                    const data = await res.json();
                    if (data && data.rates) {
                        setLiveRates(data.rates);
                    } else {
                        setLiveRates(null);
                    }
                } catch (err) {
                    console.error("Failed to fetch live rates", err);
                    setLiveRates(null);
                } finally {
                    setIsLiveRatesLoading(false);
                }
            };
            fetchRates();
        }
    }, [category]);

    const handleCategoryChange = (newCategory: string) => {
        const isAdvancedCategory = advancedCategories.includes(newCategory);
        if (isAdvancedCategory && !isAdvancedUnlocked) {
            toast({ title: 'Feature Locked', description: 'Reach Level 2 to unlock advanced converter categories.', variant: 'destructive' });
            return;
        }

        setCategory(newCategory);
        const newCategoryData = CATEGORIES.find((c) => c.name === newCategory);
        if (newCategoryData) {
            const newUnits = region === 'Local'
                ? newCategoryData.units.filter(u => !u.region || u.region === 'Indian')
                : newCategoryData.units.filter(u => !u.region);

            if (newUnits.length >= 2) {
                setFromUnit(newUnits[0].name);
                setToUnit(newUnits[1].name);
            } else if (newUnits.length === 1) {
                setFromUnit(newUnits[0].name);
                setToUnit(newUnits[0].name);
            }
        }
    };

    const handleSwap = () => {
        const currentFromResult = result;
        const currentFromUnit = fromUnit;
        const currentToUnit = toUnit;

        setFromUnit(currentToUnit);
        setToUnit(currentFromUnit);

        if (currentFromResult && currentFromResult !== 'N/A') {
            setInputValue(currentFromResult.replace(/,/g, ''));
        }
    };

    const handleAddToHistory = () => {
        const conversionResult = handleConversion();
        if (conversionResult) {
            addConversionToHistory({
                fromValue: conversionResult.fromValue,
                fromUnit: conversionResult.fromUnit,
                toValue: conversionResult.toValue,
                toUnit: conversionResult.toUnit,
                category: conversionResult.category,
            });
            addXP?.(1, 'Saved a conversion');
            toast({ title: 'Saved to History' });
        }
    };

    const handleRestoreHistory = (itemToRestore: ConversionHistoryItem) => {
        setInputValue(itemToRestore.fromValue);
        setCategory(itemToRestore.category);
        setFromUnit(itemToRestore.fromUnit);
        setToUnit(itemToRestore.toUnit);
    };

    const handleFavoriteToggle = () => {
        const favoriteItem = favorites.find(fav => fav.category === category && fav.fromUnit === fromUnit && fav.toUnit === toUnit);

        if (favoriteItem) {
            deleteFavorite(favoriteItem.id);
            toast({ title: 'Removed from favorites' });
        } else {
            addFavorite({
                fromValue: inputValue,
                fromUnit,
                toValue: result,
                toUnit,
                category
            });
            toast({ title: 'Added to favorites!' });
        }
    };

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            toast({ title: 'Copied!', description: 'Result copied to clipboard.' });
        }
    };

    const UnitSelector = ({ value, onChange, label, availableUnits }: { value: string; onChange: (v: string) => void; label: string; availableUnits: Unit[] }) => {
        const unitDetails = availableUnits.find(u => u.name === value);
        return (
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full bg-transparent border-none text-foreground font-semibold h-10 px-2 focus:ring-0 shadow-none justify-start gap-1">
                    <SelectValue>
                        {unitDetails ? `${unitDetails.name} (${unitDetails.symbol})` : label}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover/90 backdrop-blur-xl border-border/50 text-foreground rounded-2xl max-h-64">
                    {availableUnits.map((unit) => (
                        <SelectItem key={unit.name} value={unit.name} className="rounded-xl mx-1 my-0.5 focus:bg-primary/20">
                            {`${unit.name} (${unit.symbol})`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    const conversionHistory = history
        .filter(item => item.type === 'conversion')
        .slice(0, 5) as ConversionHistoryItem[];

    const getTextSizeClass = (text: string) => {
        const len = text.length;
        if (len > 12) return 'text-xl md:text-2xl';
        if (len > 8) return 'text-2xl md:text-3xl';
        if (len > 5) return 'text-3xl md:text-4xl';
        return 'text-4xl md:text-5xl';
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-24">
            {/* Background glowing orbs */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -z-10" />
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -z-10" />

            <div className="w-full max-w-md mx-auto space-y-6 pt-6 px-4">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400">
                        Converter
                    </h1>
                    <p className="text-sm text-muted-foreground">Convert units instantly</p>
                </div>

                {/* Top Controls: Region & Category */}
                <div className="grid grid-cols-2 gap-3">
                    <Select value={region} onValueChange={setRegion}>
                        <SelectTrigger className="w-full bg-card/60 backdrop-blur-xl border-border/50 text-foreground h-12 rounded-2xl focus:ring-primary shadow-sm">
                            <SelectValue placeholder="Region" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover/90 backdrop-blur-xl border-border/50 rounded-2xl">
                            <SelectItem value="International" className="rounded-xl mx-1">International</SelectItem>
                            <SelectItem value="Local" className="rounded-xl mx-1">Local (Indian)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={category} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-full bg-card/60 backdrop-blur-xl border-border/50 text-foreground h-12 rounded-2xl focus:ring-primary shadow-sm">
                            <div className="flex items-center gap-2 truncate">
                                {React.createElement(activeCategory.icon, { className: 'h-4 w-4 shrink-0 text-primary' })}
                                <span className="truncate font-medium">{category}</span>
                                {category === 'Currency' && liveRates && (
                                    <span className="ml-2 flex items-center gap-1 bg-green-500/10 text-green-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-green-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        LIVE
                                    </span>
                                )}
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-popover/90 backdrop-blur-xl border-border/50 max-h-[300px] rounded-2xl">
                            {CATEGORIES.map((cat) => {
                                const isAdvancedCategory = advancedCategories.includes(cat.name);
                                return (
                                    <SelectItem key={cat.name} value={cat.name} disabled={isAdvancedCategory && !isAdvancedUnlocked} className="rounded-xl mx-1 my-0.5">
                                        <div className="flex items-center justify-between w-full gap-3">
                                            <div className="flex items-center gap-2">
                                                <cat.icon className="h-4 w-4 text-muted-foreground" />
                                                <span>{cat.name}</span>
                                            </div>
                                            {isAdvancedCategory && !isAdvancedUnlocked && <Lock className="h-3 w-3 text-muted-foreground/50" />}
                                        </div>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Mode Toggle (Segmented Control) */}
                <div className="flex p-1 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50">
                    <button
                        onClick={() => setBulkMode(false)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-xl transition-all",
                            !bulkMode ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Calculator className="h-4 w-4" /> Single
                    </button>
                    <button
                        onClick={() => setBulkMode(true)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-xl transition-all",
                            bulkMode ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Table className="h-4 w-4" /> Bulk
                    </button>
                </div>

                {!bulkMode ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 relative"
                    >
                        {/* FROM Card */}
                        <Card className="bg-card/70 backdrop-blur-xl border border-border/50 shadow-md rounded-3xl overflow-hidden pt-2">
                            <CardContent className="p-4 space-y-1">
                                <div className="flex justify-between items-center px-1">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From</Label>
                                    {fromUnitDetails?.isStandard && (
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                            <Info className="h-3 w-3" /> Standard
                                        </span>
                                    )}
                                </div>
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className={cn(getTextSizeClass(inputValue), "font-black h-16 border-none bg-transparent text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-0 px-1 shadow-none transition-all duration-200")}
                                    placeholder="0"
                                />
                                <div className="bg-black/5 dark:bg-white/5 rounded-xl border border-border/30">
                                    <UnitSelector value={fromUnit} onChange={setFromUnit} label="Unit" availableUnits={units} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Swap Button */}
                        <div className="flex justify-center -my-8 relative z-10">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full bg-primary text-primary-foreground border-4 border-background h-14 w-14 shadow-xl transition-transform hover:scale-110 active:scale-95"
                                onClick={handleSwap}
                            >
                                <ArrowRightLeft className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* TO Card */}
                        <Card className="bg-card/70 backdrop-blur-xl border border-border/50 shadow-md rounded-3xl overflow-hidden pb-2">
                            <CardContent className="p-4 space-y-1">
                                <div className="flex justify-between items-center px-1 pt-4">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To</Label>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors" onClick={handleCopy}>
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors" onClick={handleFavoriteToggle}>
                                            <Star className={cn("h-3.5 w-3.5", isFavorited && "fill-amber-400 text-amber-400")} />
                                        </Button>
                                    </div>
                                </div>
                                <div className={cn(getTextSizeClass(result || '0'), "font-black h-16 px-1 flex items-center text-foreground truncate overflow-hidden transition-all duration-200")}>
                                    {result ? formatIndianNumber(parseFloat(result)) : '0'}
                                </div>
                                <div className="bg-black/5 dark:bg-white/5 rounded-xl border border-border/30">
                                    <UnitSelector value={toUnit} onChange={setToUnit} label="Unit" availableUnits={units} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions Bar */}
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <div className="flex p-1.5 bg-card/60 backdrop-blur-xl rounded-full border border-border/50 shadow-sm overflow-x-auto no-scrollbar gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFormula(!showFormula)}
                                    className={cn("rounded-full h-8 px-3 text-xs font-medium transition-colors", showFormula ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                                >
                                    <Info className='h-3 w-3 mr-1.5' /> Formula
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllConversions(!showAllConversions)}
                                    className={cn("rounded-full h-8 px-3 text-xs font-medium transition-colors", showAllConversions ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                                >
                                    <Table className='h-3 w-3 mr-1.5' /> All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAddToHistory}
                                    className="rounded-full h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
                                >
                                    <Power className='h-3 w-3 mr-1.5' /> Save
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCompareDialogOpen(true)}
                                    className="rounded-full h-8 px-3 text-xs font-medium text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-600"
                                >
                                    <Eye className='h-3 w-3 mr-1.5' /> Compare
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
                                            <Settings2 className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-4 rounded-2xl bg-popover/90 backdrop-blur-xl border-border/50 shadow-xl" align="end">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Precision</Label>
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{precision} decimals</span>
                                            </div>
                                            <Slider
                                                value={[precision]}
                                                onValueChange={(val) => setPrecision(val[0])}
                                                min={1}
                                                max={10}
                                                step={1}
                                                className="py-2"
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Expandable Sections */}
                        <AnimatePresence>
                            {showFormula && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-4 mt-2">
                                        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Conversion Formula</div>
                                        <p className="text-sm font-mono text-foreground break-words">{formula}</p>
                                    </div>
                                </motion.div>
                            )}

                            {showAllConversions && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden mt-2"
                                >
                                    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">All Conversions</Label>
                                            <Button variant="ghost" size="sm" onClick={copyAllConversions} className="h-6 px-2 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 rounded-full">
                                                Copy All
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                                            {allConversions.map((conversion, idx) => (
                                                <div key={idx} className={cn("p-3 rounded-xl bg-background/50 border border-border/30", conversion.isStandard && "border-blue-500/30 bg-blue-500/5")}>
                                                    <div className="text-[10px] text-muted-foreground mb-1">{conversion.unit}</div>
                                                    <div className="text-sm font-bold text-foreground truncate">{formatIndianNumber(conversion.value)}</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">{conversion.symbol}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Recent History Tape */}
                        {conversionHistory.length > 0 && (
                            <div className="pt-4">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1 mb-2 block">Recent History</Label>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                    {conversionHistory.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRestoreHistory(item);
                                            }}
                                            className="px-3 py-2 rounded-xl bg-card/40 backdrop-blur-sm border border-border/50 text-[11px] text-muted-foreground hover:bg-card/80 hover:text-foreground transition-all shrink-0 flex items-center gap-2"
                                        >
                                            <span className="font-medium">{item.fromValue}</span>
                                            <ArrowRightLeft className="w-3 h-3 text-primary/60" />
                                            <span className="text-foreground font-bold">{item.toValue}</span>
                                            <span className="opacity-50">({item.toUnit.split(' ')[0]})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Bulk Conversion Mode */}
                        <Card className="bg-card/70 backdrop-blur-xl border border-border/50 shadow-md rounded-3xl overflow-hidden">
                            <CardContent className="p-5 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Data Input ({fromUnit} → {toUnit})
                                    </Label>
                                    <Textarea
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                        placeholder="Enter values separated by commas (e.g. 1, 2.5, 10, 25)"
                                        className="min-h-[120px] bg-background/50 border-border/30 text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-primary rounded-2xl resize-none p-4"
                                    />
                                </div>

                                <div className="flex flex-col gap-2 relative">
                                    <div className="bg-background/50 rounded-xl border border-border/30 p-1">
                                        <UnitSelector value={fromUnit} onChange={setFromUnit} label="From Unit" availableUnits={units} />
                                    </div>
                                    <div className="flex justify-center -my-6 relative z-10">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-full bg-primary text-primary-foreground border-4 border-card h-10 w-10 shadow-lg"
                                            onClick={handleSwap}
                                        >
                                            <ArrowRightLeft className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="bg-background/50 rounded-xl border border-border/30 p-1">
                                        <UnitSelector value={toUnit} onChange={setToUnit} label="To Unit" availableUnits={units} />
                                    </div>
                                </div>

                                {bulkResults.length > 0 && (
                                    <div className="space-y-3 pt-4 border-t border-border/30">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Results ({bulkResults.length})</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={exportBulkToCSV}
                                                className="h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold text-xs"
                                            >
                                                <Download className="h-3 w-3 mr-1" /> Export CSV
                                            </Button>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                                            {bulkResults.map((result, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30 text-sm">
                                                    <span className="text-muted-foreground">{result.input} <span className="opacity-50">{fromUnitDetails?.symbol}</span></span>
                                                    <ArrowRightLeft className="h-3 w-3 text-primary/50" />
                                                    <span className="font-bold text-foreground">{result.output} <span className="text-muted-foreground font-normal">{toUnitDetails?.symbol}</span></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>

            {fromUnitDetails && (
                <ConversionComparisonDialog
                    open={isCompareDialogOpen}
                    onOpenChange={setIsCompareDialogOpen}
                    category={category}
                    fromUnit={fromUnit}
                    fromUnitDetails={fromUnitDetails}
                    inputValue={inputValue}
                />
            )}
        </div>
    );
}
