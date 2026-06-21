"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Divide, Equal, Minus, Plus, X, Percent, History, Undo2, Trash2, ArrowLeft,
  Volume2, VolumeX, Delete, Maximize, Minimize, Calculator as CalcIcon,
  TrendingUp, PieChart, DollarSign, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile, CalculatorHistoryItem } from '@/context/ProfileContext';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProgrammerCalculator } from './programmer-calculator';
import { FinancialCalculator } from './financial-calculator';
import { SaveToBudgetDialog } from './save-to-budget-dialog';

// ─── Physical Calculator Button ───
const CalculatorButton = ({
  onClick,
  children,
  className,
  variant = 'secondary',
  size = 'default',
  btnStyle = 'number', // 'number' | 'operator' | 'function' | 'equals' | 'clear'
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'secondary' | 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | null | undefined;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  btnStyle?: 'number' | 'operator' | 'function' | 'equals' | 'clear';
}) => {
  const [calculatorSounds, setCalculatorSounds] = useState(false);

  useEffect(() => {
    const soundsEnabled = localStorage.getItem('sutradhaar_calculator_sounds') === 'true';
    setCalculatorSounds(soundsEnabled);

    const handleStorageChange = () => {
      const soundsEnabled = localStorage.getItem('sutradhaar_calculator_sounds') === 'true';
      setCalculatorSounds(soundsEnabled);
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const playSound = () => {
    if (calculatorSounds) {
      const soundFile = localStorage.getItem('sutradhaar_calculator_sound_file') || '/sound/keyboard-click-327728.mp3';
      const audio = new Audio(soundFile);
      audio.play().catch(e => console.error("Failed to play sound", e));
    }
  };

  const handleClick = () => {
    playSound();
    onClick();
  }

  // Physical button styles
  const basePhysical = "relative w-full h-full text-lg font-bold rounded-2xl border-0 outline-none transition-all duration-100 active:translate-y-[2px] select-none";
  
  const styleMap: Record<string, string> = {
    number: "bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--muted))] text-foreground shadow-[0_4px_0_0_hsl(var(--border)),0_6px_12px_rgba(0,0,0,0.15)] active:shadow-[0_1px_0_0_hsl(var(--border)),0_2px_4px_rgba(0,0,0,0.1)] hover:brightness-110",
    operator: "bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0_4px_0_0_hsl(var(--primary)/0.6),0_6px_12px_rgba(0,0,0,0.2)] active:shadow-[0_1px_0_0_hsl(var(--primary)/0.6),0_2px_4px_rgba(0,0,0,0.15)] hover:brightness-110",
    function: "bg-gradient-to-b from-[hsl(var(--muted))] to-[hsl(var(--border))] text-foreground shadow-[0_4px_0_0_hsl(var(--border)),0_6px_12px_rgba(0,0,0,0.15)] active:shadow-[0_1px_0_0_hsl(var(--border)),0_2px_4px_rgba(0,0,0,0.1)] hover:brightness-110",
    equals: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_4px_0_0_hsl(150,60%,30%),0_6px_12px_rgba(0,0,0,0.2)] active:shadow-[0_1px_0_0_hsl(150,60%,30%),0_2px_4px_rgba(0,0,0,0.15)] hover:brightness-110",
    clear: "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_4px_0_0_hsl(0,60%,35%),0_6px_12px_rgba(0,0,0,0.2)] active:shadow-[0_1px_0_0_hsl(0,60%,35%),0_2px_4px_rgba(0,0,0,0.15)] hover:brightness-110",
  };

  return (
    <motion.div whileTap={{ scale: 0.96, y: 2 }} className="w-full h-full">
      <button
        className={cn(basePhysical, styleMap[btnStyle] || styleMap.number, className)}
        onClick={handleClick}
      >
        {/* Top light reflection */}
        <div className="absolute inset-x-0 top-0 h-[40%] rounded-t-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        {children}
      </button>
    </motion.div>
  );
};

export function Calculator({ onToggleFullScreen, isFullScreen }: { onToggleFullScreen: () => void, isFullScreen?: boolean }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [mode, setMode] = useState<'basic' | 'scientific' | 'programmer' | 'financial'>('basic');
  const { profile, addCalculatorToHistory, deleteHistoryItem, addXP } = useProfile();
  const { history } = profile;
  const [calculatorSounds, setCalculatorSounds] = useState(false);
  const [memory, setMemory] = useState(0);
  const [showMemory, setShowMemory] = useState(false);
  const [isSaveToBudgetOpen, setIsSaveToBudgetOpen] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  useEffect(() => {
    const soundsEnabled = localStorage.getItem('sutradhaar_calculator_sounds') === 'true';
    setCalculatorSounds(soundsEnabled);
  }, []);

  const toggleSounds = () => {
    const newSoundsState = !calculatorSounds;
    setCalculatorSounds(newSoundsState);
    localStorage.setItem('sutradhaar_calculator_sounds', String(newSoundsState));
    window.dispatchEvent(new Event('storage'));
  };

  const handleInput = (value: string) => {
    if (display === 'Error') {
      setDisplay(value);
      setExpression(value);
      return;
    }
    if (['+', '-', '×', '÷', '^', '%'].includes(display) || expression.endsWith('(')) {
      setDisplay(value);
    } else if (display === '0' && value !== '.') {
      setDisplay(value);
    } else {
      setDisplay(display + value);
    }
    setExpression(expression + value);
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    const lastChar = expression.slice(-1);
    if (['+', '-', '×', '÷', '^', '%'].includes(lastChar)) {
      setExpression(expression.slice(0, -1) + op);
    } else if (expression !== '' && expression.slice(-1) !== '(') {
      setExpression(expression + op);
    }
    setDisplay(op);
  };

  const evaluateExpression = (expr: string): number => {
    let sanitizedExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
    while (['*', '/', '+', '-', '%'].includes(sanitizedExpr.slice(-1))) {
      sanitizedExpr = sanitizedExpr.slice(0, -1);
    }

    const scientificExpr = sanitizedExpr
      .replace(/(\d+(\.\d+)?)\s*\^\s*(\d+(\.\d+)?)/g, 'Math.pow($1, $3)')
      .replace(/sin\(([^)]+)\)/g, (match, p1) => `Math.sin((${p1}) * Math.PI / 180)`)
      .replace(/cos\(([^)]+)\)/g, (match, p1) => `Math.cos((${p1}) * Math.PI / 180)`)
      .replace(/tan\(([^)]+)\)/g, (match, p1) => `Math.tan((${p1}) * Math.PI / 180)`)
      .replace(/log\(([^)]+)\)/g, 'Math.log10($1)')
      .replace(/ln\(([^)]+)\)/g, 'Math.log($1)')
      .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
      .replace(/(\d+)!/g, (match, num) => {
        const n = parseInt(num);
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result.toString();
      });

    try {
      const openParen = (scientificExpr.match(/\(/g) || []).length;
      const closeParen = (scientificExpr.match(/\)/g) || []).length;
      const finalExpr = scientificExpr + ')'.repeat(openParen - closeParen);

      return new Function('return ' + finalExpr)();
    } catch (e) {
      console.error("Calculation Error:", e);
      throw new Error("Invalid Expression");
    }
  };

  const handleEquals = () => {
    if (display === 'Error' || expression === '') return;
    try {
      const currentExpression = expression;
      const result = evaluateExpression(currentExpression);
      const finalResult = parseFloat(result.toFixed(2));

      addCalculatorToHistory({
        expression: currentExpression,
        result: finalResult.toString(),
      });
      addXP?.(1, 'Solved a calculation');

      setDisplay(finalResult.toString());
      setExpression(finalResult.toString());
    } catch (error) {
      setDisplay('Error');
      setExpression('');
    }
  };

  const handleAllClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    if (display === 'Error' || display === '0') return;
    if (['+', '-', '×', '÷', '^', '%'].includes(display) || display.endsWith('(')) {
      return;
    }
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    setExpression(prev => prev.length > 1 ? prev.slice(0, -1) : '');
  };

  const handlePlusMinus = () => {
    if (display === 'Error' || display === '0' || ['+', '-', '×', '÷'].includes(display)) return;
    const operators = /([+\-×÷^])/;
    const parts = expression.split(operators);
    const lastPart = parts.pop() || '';

    if (lastPart && !isNaN(parseFloat(lastPart))) {
      const newLastPart = (parseFloat(lastPart) * -1).toString();
      const newExpression = parts.join('') + newLastPart;
      setExpression(newExpression);
      setDisplay(newLastPart);
    }
  };

  const handlePercent = () => {
    if (display === 'Error') return;
    try {
      const value = parseFloat(display);
      if (!isNaN(value)) {
        const result = value / 100;
        setDisplay(result.toString());
        const operators = /([+\-×÷^])/;
        const parts = expression.split(operators);
        const lastPart = parts[parts.length - 1];
        if (!isNaN(parseFloat(lastPart))) {
          const newExpression = expression.slice(0, expression.length - lastPart.length) + result.toString();
          setExpression(newExpression);
        }
      }
    } catch (e) {
      setDisplay('Error');
      setExpression('');
    }
  };

  const handleSciFunction = (func: string) => {
    if (display === 'Error') {
      setDisplay(`${func}(`);
      setExpression(`${func}(`);
      return;
    }

    const currentDisplayIsOperator = ['+', '-', '×', '÷', '^'].includes(display);

    if (display === '0' || currentDisplayIsOperator || expression.endsWith('(')) {
      setDisplay(`${func}(`);
      if (display === '0' && expression === '0') {
        setExpression(`${func}(`);
      } else if (currentDisplayIsOperator || expression.endsWith('(')) {
        setExpression(expression + `${func}(`);
      } else {
        setExpression(`${func}(`);
      }
    } else {
      setExpression(expression + `${func}(`);
      setDisplay(`${func}(`);
    }
  };

  // Memory functions
  const handleMemoryAdd = () => {
    const value = parseFloat(display);
    if (!isNaN(value)) {
      setMemory(prev => prev + value);
      setShowMemory(true);
    }
  };

  const handleMemorySubtract = () => {
    const value = parseFloat(display);
    if (!isNaN(value)) {
      setMemory(prev => prev - value);
      setShowMemory(true);
    }
  };

  const handleMemoryRecall = () => {
    setDisplay(memory.toString());
    setExpression(memory.toString());
  };

  const handleMemoryClear = () => {
    setMemory(0);
    setShowMemory(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on an input or textarea
      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      const key = e.key;
      if (/^[0-9.]$/.test(key)) {
        e.preventDefault();
        handleInput(key);
      } else if (['+', '-', '^'].includes(key)) {
        e.preventDefault();
        handleOperator(key);
      } else if (key === '*') {
        e.preventDefault();
        handleOperator('×');
      } else if (key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape') {
        e.preventDefault();
        handleAllClear();
      } else if (key === '%') {
        e.preventDefault();
        handlePercent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, expression]);

  const handleRestoreHistory = (item: CalculatorHistoryItem) => {
    setExpression(item.expression);
    setDisplay(item.result);
  };

  const calculatorHistory = history
    .filter(item => item.type === 'calculator') as CalculatorHistoryItem[];

  return (
    <div className="h-full flex flex-col max-w-lg mx-auto w-full pt-2 px-2">
      {/* ── Calculator Body (Physical Casing) ── */}
      <div
        className="flex-1 overflow-hidden relative flex flex-col rounded-[28px]"
        style={{
          background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--muted)))',
          boxShadow: `
            0 2px 0 0 hsl(var(--border)),
            0 -1px 0 0 hsl(var(--card)),
            inset 0 1px 0 0 rgba(255,255,255,0.08),
            0 20px 60px rgba(0,0,0,0.3),
            0 8px 20px rgba(0,0,0,0.2)
          `,
        }}
      >
        {/* Top edge highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-t-[28px] z-10" />
        
        {/* Inner padding area */}
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          
          {/* ── LCD Display ── */}
          <div
            className="relative rounded-2xl overflow-hidden shrink-0"
            style={{
              background: 'linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(var(--background)/0.8) 100%)',
              boxShadow: `
                inset 0 2px 8px rgba(0,0,0,0.2),
                inset 0 0 0 1px hsl(var(--border)/0.5),
                0 1px 0 0 rgba(255,255,255,0.05)
              `,
            }}
          >
            {/* LCD scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
              }}
            />
            
            <div className="px-5 pt-3 pb-4 relative z-0">
              {/* Top toolbar */}
              <div className='flex justify-between items-center mb-2'>
                <div className="flex gap-1">
                  <button
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
                    onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                    title="History"
                  >
                    <History className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
                    onClick={() => setIsSaveToBudgetOpen(true)}
                    title="Save to Budget"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  {showMemory && (
                    <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[10px] font-bold flex items-center gap-1">
                      M: {memory}
                    </div>
                  )}
                </div>
                {/* Solar panel decoration */}
                <div className="flex gap-[2px]">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-4 h-2 rounded-[2px] bg-gradient-to-b from-blue-900/30 to-blue-950/40 border border-blue-900/20" />
                  ))}
                </div>
              </div>
              
              {/* Expression line */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={expression}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="text-muted-foreground text-base truncate leading-tight text-right font-mono"
                >
                  {expression || '0'}
                </motion.div>
              </AnimatePresence>

              {/* In-Line History Tape */}
              {calculatorHistory.length > 0 && (
                <div className="w-full overflow-x-auto no-scrollbar py-1 mt-1 mb-1 flex justify-end">
                   <div className="flex gap-2 w-max items-center justify-end">
                     {calculatorHistory.slice(0, 5).map(item => (
                       <button
                         key={item.id}
                         onClick={() => {
                            setExpression(item.expression);
                            setDisplay(item.result);
                         }}
                         className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground transition-colors shrink-0 max-w-[150px] truncate"
                         title={`${item.expression} = ${item.result}`}
                       >
                         {item.expression} = <span className="text-foreground font-semibold">{item.result}</span>
                       </button>
                     ))}
                   </div>
                </div>
              )}
              
              {/* Main display */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={display}
                  initial={{ scale: 0.97, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.03, opacity: 0 }}
                  className="text-foreground text-5xl font-extrabold flex items-end justify-end truncate leading-tight mt-1 font-mono tracking-tight"
                >
                  {display}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Mode Tabs ── */}
          <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="w-full whitespace-nowrap shrink-0">
              <div className="flex space-x-2 pb-1">
                {[
                  { id: 'basic', label: 'Basic', icon: CalcIcon },
                  { id: 'scientific', label: 'Scientific', icon: Zap },
                  { id: 'programmer', label: 'Programmer', icon: TrendingUp },
                  { id: 'financial', label: 'Financial', icon: DollarSign },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMode(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200",
                      mode === tab.id
                        ? "bg-primary text-primary-foreground shadow-[0_2px_0_0_hsl(var(--primary)/0.5),0_4px_8px_rgba(0,0,0,0.2)]"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground shadow-[0_2px_0_0_hsl(var(--border)),0_3px_6px_rgba(0,0,0,0.1)]"
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>

            {/* ── Basic Mode: Physical Keypad ── */}
            <TabsContent value="basic" className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="grid grid-cols-4 gap-2.5 flex-1">
                <CalculatorButton onClick={handleAllClear} btnStyle="clear">AC</CalculatorButton>
                <CalculatorButton onClick={handleBackspace} btnStyle="function">
                  <Delete size={18} />
                </CalculatorButton>
                <CalculatorButton onClick={handlePercent} btnStyle="function">%</CalculatorButton>
                <CalculatorButton onClick={() => handleOperator('÷')} btnStyle="operator">
                  <Divide size={20} />
                </CalculatorButton>

                <CalculatorButton onClick={() => handleInput('7')} btnStyle="number">7</CalculatorButton>
                <CalculatorButton onClick={() => handleInput('8')} btnStyle="number">8</CalculatorButton>
                <CalculatorButton onClick={() => handleInput('9')} btnStyle="number">9</CalculatorButton>
                <CalculatorButton onClick={() => handleOperator('×')} btnStyle="operator">
                  <X size={20} />
                </CalculatorButton>

                <CalculatorButton onClick={() => handleInput('4')} btnStyle="number">4</CalculatorButton>
                <CalculatorButton onClick={() => handleInput('5')} btnStyle="number">5</CalculatorButton>
                <CalculatorButton onClick={() => handleInput('6')} btnStyle="number">6</CalculatorButton>
                <CalculatorButton onClick={() => handleOperator('-')} btnStyle="operator">
                  <Minus size={20} />
                </CalculatorButton>

                <CalculatorButton onClick={() => handleInput('1')} btnStyle="number">1</CalculatorButton>
                <CalculatorButton onClick={() => handleInput('2')} btnStyle="number">2</CalculatorButton>
                <CalculatorButton onClick={() => handleInput('3')} btnStyle="number">3</CalculatorButton>
                <CalculatorButton onClick={() => handleOperator('+')} btnStyle="operator">
                  <Plus size={20} />
                </CalculatorButton>

                <CalculatorButton onClick={handlePlusMinus} btnStyle="function">+/-</CalculatorButton>
                <CalculatorButton onClick={() => handleInput('0')} btnStyle="number">0</CalculatorButton>
                <CalculatorButton onClick={() => handleInput('.')} btnStyle="number">.</CalculatorButton>
                <CalculatorButton onClick={handleEquals} btnStyle="equals">
                  <Equal size={20} />
                </CalculatorButton>
              </div>
            </TabsContent>

            {/* Scientific Mode — Coming Soon */}
            <TabsContent value="scientific" className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:items-center data-[state=active]:justify-center">
              <div className="flex flex-col items-center justify-center text-center px-6 py-8 gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                    <Zap className="w-9 h-9 text-purple-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold text-white shadow-lg">
                    SOON
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Scientific Calculator</h3>
                  <p className="text-sm text-muted-foreground mt-1">Advanced functions like sin, cos, log, and more are coming soon.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['sin', 'cos', 'tan', 'log', 'ln', '√', 'π', 'e', 'x^y'].map(fn => (
                    <span key={fn} className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-semibold border border-purple-500/20">{fn}</span>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Programmer Mode — Coming Soon */}
            <TabsContent value="programmer" className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:items-center data-[state=active]:justify-center">
              <div className="flex flex-col items-center justify-center text-center px-6 py-8 gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                    <TrendingUp className="w-9 h-9 text-blue-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-[10px] font-bold text-white shadow-lg">
                    SOON
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Programmer Calculator</h3>
                  <p className="text-sm text-muted-foreground mt-1">Binary, hex, octal conversions and bitwise operations coming soon.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['BIN', 'HEX', 'OCT', 'DEC', 'AND', 'OR', 'XOR', 'NOT', 'SHIFT'].map(fn => (
                    <span key={fn} className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">{fn}</span>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Financial Mode */}
            <TabsContent value="financial" className="mt-6">
              <FinancialCalculator currentCalcValue={display} />
            </TabsContent>
          </Tabs>

          {/* ── History Panel Overlay ── */}
          <AnimatePresence>
            {showHistoryPanel && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-x-0 bottom-0 top-[140px] z-10 flex flex-col rounded-b-[28px] overflow-hidden"
                style={{
                  background: 'hsl(var(--card) / 0.97)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50"
                  style={{ background: 'hsl(var(--muted) / 0.5)' }}
                >
                  <div className="flex items-center gap-2">
                    <button className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors" onClick={() => setShowHistoryPanel(false)} title="Back">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold flex items-center gap-2 text-sm">
                      <History className="w-4 h-4 text-orange-500" />
                      Calculation History
                    </h3>
                  </div>
                  <button className="h-7 px-2 flex items-center rounded-lg text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors font-medium" onClick={() => {
                    const calcItems = history.filter(item => item.type === 'calculator');
                    calcItems.forEach(item => deleteHistoryItem(item.id));
                  }}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear All
                  </button>
                </div>
                <ScrollArea className="flex-1 p-2">
                  {calculatorHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <History className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm">No history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {calculatorHistory.map((item) => (
                        <div 
                          key={item.id}
                          className="flex flex-col items-end p-3 hover:bg-accent rounded-xl cursor-pointer transition-colors group"
                          onClick={() => {
                            handleRestoreHistory(item);
                            setShowHistoryPanel(false);
                          }}
                        >
                          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-mono">{item.expression} =</span>
                          <span className="text-xl font-bold text-foreground font-mono">{item.result}</span>
                          <span className="text-[10px] text-muted-foreground mt-1 opacity-50">{new Date(item.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom brand strip */}
        <div className="h-6 flex items-center justify-center shrink-0"
          style={{ background: 'hsl(var(--muted) / 0.3)' }}
        >
          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">Sutradhaar</span>
        </div>
      </div>

      <SaveToBudgetDialog
        open={isSaveToBudgetOpen}
        onOpenChange={setIsSaveToBudgetOpen}
        amount={display}
      />
    </div>
  );
}
