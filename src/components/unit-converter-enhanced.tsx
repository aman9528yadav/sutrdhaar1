"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    ArrowRightLeft,
    Star,
    Copy,
    Info,
    History,
    Power,
    Undo2,
    Lock,
    ChevronDown,
    ChevronUp,
    Download,
    Calculator,
    Settings2,
    Table,
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
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CATEGORIES, convert, getConversionFormula, Unit } from '@/lib/units';
import { useToast } from '@/hooks/use-toast';
import { cn, formatIndianNumber } from '@/lib/utils';

import { useProfile, ConversionHistoryItem } from '@/context/ProfileContext';
import Link from 'next/link';
import { ConversionComparisonDialog } from './conversion-comparison-dialog';
import { hasUnlockedFeature } from '@/lib/level-system';

const advancedCategories = ['Pressure', 'Data', 'Power', 'Force', 'Currency'];

export function UnitConverterEnhanced() {
    const { toast } = useToast();
    const { profile, addConversionToHistory, addFavorite, deleteFavorite, deleteHistoryItem, addXP } = useProfile();
    const { history, favorites, membership } = profile;

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
        return getConversionFormula(fromUnit, toUnit, category);
    }, [fromUnit, toUnit, category]);

    const allConversions = useMemo(() => {
        const value = parseFloat(inputValue);
        if (isNaN(value)) return [];

        return units.map(unit => {
            const convertedValue = convert(value, fromUnit, unit.name, category);
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
    }, [inputValue, fromUnit, category, units, precision]);

    const conversionInfo = useMemo(() => {
        if (!fromUnitDetails || !toUnitDetails) return '';
        const oneUnitConversion = convert(1, fromUnit, toUnit, category);
        if (oneUnitConversion !== null) {
            const formattedResult = Number(oneUnitConversion.toPrecision(precision));
            return `1 ${fromUnitDetails.symbol} = ${formattedResult} ${toUnitDetails.symbol}`;
        }
        return '';
    }, [fromUnit, toUnit, category, fromUnitDetails, toUnitDetails, precision]);

    const handleConversion = useCallback((valueStr?: string) => {
        const valueToConvert = valueStr || inputValue;
        const value = parseFloat(valueToConvert);
        if (isNaN(value)) {
            setResult('');
            return;
        }
        const convertedValue = convert(value, fromUnit, toUnit, category);
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
    }, [inputValue, fromUnit, toUnit, category, precision]);

    const handleBulkConversion = useCallback(() => {
        const values = bulkInput.split(',').map(v => v.trim()).filter(v => v);
        const results = values.map(val => {
            const num = parseFloat(val);
            if (isNaN(num)) {
                return { input: val, output: 'Invalid' };
            }
            const converted = convert(num, fromUnit, toUnit, category);
            if (converted !== null) {
                const formatted = Number(converted.toPrecision(precision));
                return { input: val, output: formatted.toString() };
            }
            return { input: val, output: 'N/A' };
        });
        setBulkResults(results);
    }, [bulkInput, fromUnit, toUnit, category, precision]);

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
            toast({ title: 'Removed from favorites.' });
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
                <SelectTrigger className="w-full bg-card border-border/50 text-foreground backdrop-blur-sm h-12 rounded-xl focus:ring-primary">
                    <SelectValue>
                        {unitDetails ? `${unitDetails.name} (${unitDetails.symbol})` : label}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50 text-foreground">
                    {availableUnits.map((unit) => (
                        <SelectItem key={unit.name} value={unit.name} className="focus:bg-accent focus:text-accent-foreground">
                            {`${unit.name} (${unit.symbol})`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    const conversionHistory = history
        .filter(item => item.type === 'conversion')
        .slice(0, 3) as ConversionHistoryItem[];

    return (
        <div className="space-y-6 pb-6 max-w-3xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-600">
                        Converter
                    </h1>
                    <p className="text-muted-foreground mt-1">Convert units instantly</p>
                </div>
            </div>

            <Card className="bg-card/50 border-border/50 shadow-sm rounded-3xl overflow-hidden relative">
                <CardContent className="p-6 space-y-8">
                    {/* Top Controls */}
                    <div className="flex gap-3">
                        <div className="w-1/3">
                            <Select value={region} onValueChange={setRegion}>
                                <SelectTrigger className="w-full bg-card border-border/50 text-foreground h-10 rounded-xl focus:ring-primary">
                                    <SelectValue placeholder="Region" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border/50 text-foreground">
                                    <SelectItem value="International" className="focus:bg-accent focus:text-accent-foreground">International</SelectItem>
                                    <SelectItem value="Local" className="focus:bg-accent focus:text-accent-foreground">Local (Indian)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Select value={category} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="w-full bg-card border-border/50 text-foreground h-10 rounded-xl focus:ring-primary">
                                    <div className="flex items-center gap-2 truncate">
                                        {React.createElement(activeCategory.icon, { className: 'h-4 w-4 shrink-0' })}
                                        <span className="truncate">{category}</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border/50 text-foreground max-h-[300px]">
                                    {CATEGORIES.map((cat) => {
                                        const isAdvancedCategory = advancedCategories.includes(cat.name);
                                        return (
                                            <SelectItem key={cat.name} value={cat.name} disabled={isAdvancedCategory && !isAdvancedUnlocked} className="focus:bg-accent focus:text-accent-foreground">
                                                <div className="flex items-center justify-between w-full gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <cat.icon className="h-4 w-4" />
                                                        <span>{cat.name}</span>
                                                    </div>
                                                    {isAdvancedCategory && !isAdvancedUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2">
                        <Button
                            variant={!bulkMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setBulkMode(false)}
                            className={cn(
                                "flex-1 rounded-xl",
                                !bulkMode ? "bg-primary text-primary-foreground shadow-sm" : "bg-transparent border-border/50 text-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Calculator className="h-4 w-4 mr-2" />
                            Single
                        </Button>
                        <Button
                            variant={bulkMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setBulkMode(true)}
                            className={cn(
                                "flex-1 rounded-xl",
                                bulkMode ? "bg-primary text-primary-foreground shadow-sm" : "bg-transparent border-border/50 text-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Table className="h-4 w-4 mr-2" />
                            Bulk
                        </Button>
                    </div>

                    {/* Precision Control */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                <Settings2 className="h-3 w-3" />
                                Precision: {precision} decimals
                            </Label>
                        </div>
                        <Slider
                            value={[precision]}
                            onValueChange={(value) => setPrecision(value[0])}
                            min={1}
                            max={10}
                            step={1}
                            className="w-full"
                        />
                    </div>

                    {!bulkMode ? (
                        <>
                            {/* Main Converter Area */}
                            <div className="space-y-6 relative">
                                {/* From Section */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-medium text-muted-foreground">From</label>
                                        {fromUnitDetails?.isStandard && (
                                            <span className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Info className="h-3 w-3" /> Standard
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            className="flex-1 text-3xl font-bold h-14 px-4 border-border/50 bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-primary rounded-xl"
                                            placeholder="0"
                                        />
                                        <div className="w-[40%]">
                                            <UnitSelector value={fromUnit} onChange={setFromUnit} label="Unit" availableUnits={units} />
                                        </div>
                                    </div>
                                </div>

                                {/* Swap Button */}
                                <div className="flex justify-center -my-3 relative z-10">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full bg-card border-border/50 text-foreground hover:bg-accent hover:text-accent-foreground h-10 w-10 shadow-sm transition-transform hover:scale-110 active:scale-95"
                                        onClick={handleSwap}
                                    >
                                        <ArrowRightLeft className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* To Section */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-medium text-muted-foreground">To</label>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full" onClick={handleCopy}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full" onClick={handleFavoriteToggle}>
                                                <Star className={cn("h-4 w-4", isFavorited && "fill-current text-yellow-500")} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <div className="flex-1 h-14 px-4 flex items-center bg-card border border-border/50 rounded-xl overflow-hidden">
                                            <span className="text-3xl font-bold text-foreground truncate">
                                                {result ? formatIndianNumber(parseFloat(result)) : '0'}
                                            </span>
                                        </div>
                                        <div className="w-[40%]">
                                            <UnitSelector value={toUnit} onChange={setToUnit} label="Unit" availableUnits={units} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* In-Line History Tape */}
                            {conversionHistory.length > 0 && (
                                <div className="w-full overflow-x-auto no-scrollbar py-2 mt-2 -mb-2 flex justify-start">
                                   <div className="flex gap-2 w-max items-center">
                                     {conversionHistory.map(item => (
                                       <button
                                         key={item.id}
                                         onClick={(e) => {
                                             e.preventDefault();
                                             handleRestoreHistory(item);
                                         }}
                                         className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground transition-colors shrink-0 flex items-center gap-1.5"
                                         title={`${item.fromValue} ${item.fromUnit} = ${item.toValue} ${item.toUnit}`}
                                       >
                                         <span>{item.fromValue}</span>
                                         <ArrowRightLeft className="w-2.5 h-2.5 text-muted-foreground/60" />
                                         <span className="text-foreground font-semibold">{item.toValue}</span>
                                         <span className="text-muted-foreground/60 hidden sm:inline">({item.toUnit.split(' ')[0]})</span>
                                       </button>
                                     ))}
                                   </div>
                                </div>
                            )}

                            {/* Conversion Info */}
                            {conversionInfo && (
                                <div className="text-center">
                                    <span className="inline-block px-3 py-1 rounded-full bg-accent/50 text-xs text-muted-foreground border border-border/50">
                                        {conversionInfo}
                                    </span>
                                </div>
                            )}

                            {/* Formula Display */}
                            {showFormula && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-semibold text-blue-500">Conversion Formula</span>
                                    </div>
                                    <p className="text-sm text-foreground font-mono">{formula}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowFormula(!showFormula)}
                                    className="bg-transparent border-border/50 text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl"
                                >
                                    <Info className='h-4 w-4 mr-1' />
                                    Formula
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAllConversions(!showAllConversions)}
                                    className="bg-transparent border-border/50 text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl"
                                >
                                    {showAllConversions ? <ChevronUp className='h-4 w-4 mr-1' /> : <ChevronDown className='h-4 w-4 mr-1' />}
                                    All
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAddToHistory}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold shadow-sm"
                                >
                                    <Power className='h-4 w-4 mr-1' />
                                    Save
                                </Button>
                            </div>

                            {/* Multiple Unit Display */}
                            {showAllConversions && (
                                <Collapsible open={showAllConversions}>
                                    <CollapsibleContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="text-xs text-muted-foreground">All Conversions</Label>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={copyAllConversions}
                                                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                    <Copy className="h-3 w-3 mr-1" />
                                                    Copy All
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                                {allConversions.map((conversion, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={cn(
                                                            "p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-accent/50 transition-colors",
                                                            conversion.isStandard && "border-blue-500/30 bg-blue-500/5"
                                                        )}
                                                    >
                                                        <div className="text-xs text-muted-foreground mb-1">{conversion.unit}</div>
                                                        <div className="text-lg font-bold text-foreground truncate">
                                                            {formatIndianNumber(conversion.value)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{conversion.symbol}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Bulk Conversion Mode */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">
                                        Enter comma-separated values to convert from {fromUnit} to {toUnit}
                                    </Label>
                                    <Textarea
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                        placeholder="Example: 1, 2.5, 10, 25, 100"
                                        className="min-h-[100px] bg-card border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary rounded-xl"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <UnitSelector value={fromUnit} onChange={setFromUnit} label="From Unit" availableUnits={units} />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full bg-card border-border/50 text-foreground hover:bg-accent"
                                        onClick={handleSwap}
                                    >
                                        <ArrowRightLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex-1">
                                        <UnitSelector value={toUnit} onChange={setToUnit} label="To Unit" availableUnits={units} />
                                    </div>
                                </div>

                                {bulkResults.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm text-foreground">Results ({bulkResults.length})</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={exportBulkToCSV}
                                                className="h-8 bg-transparent border-border/50 text-foreground hover:bg-accent"
                                            >
                                                <Download className="h-3 w-3 mr-1" />
                                                Export CSV
                                            </Button>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto space-y-2">
                                            {bulkResults.map((result, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
                                                >
                                                    <span className="text-muted-foreground">{result.input} {fromUnitDetails?.symbol}</span>
                                                    <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                                    <span className="font-bold text-foreground">{result.output} {toUnitDetails?.symbol}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>



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
