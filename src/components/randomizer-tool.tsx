"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dices, 
  Coins, 
  Shuffle, 
  RotateCw, 
  Sparkles, 
  HelpCircle,
  Hash,
  ListFilter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Mode = 'dice' | 'coin' | 'number' | 'decision';

export function RandomizerTool() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('dice');

  // 1. 3D Dice State
  const [diceCount, setDiceCount] = useState<1 | 2>(1);
  const [diceValues, setDiceValues] = useState<number[]>([1]);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceRotations, setDiceRotations] = useState<{ x: number; y: number }[]>([{ x: 0, y: 0 }]);

  // 2. 3D Coin Toss State
  const [coinResult, setCoinResult] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinRotation, setCoinRotation] = useState(0);

  // 3. Random Number Picker
  const [minNum, setMinNum] = useState('1');
  const [maxNum, setMaxNum] = useState('100');
  const [pickedNumber, setPickedNumber] = useState<number | null>(null);
  const [isPickingNum, setIsPickingNum] = useState(false);

  // 4. Decision / Wheel Maker
  const [decisionInput, setDecisionInput] = useState('Yes, No, Maybe, Definitely');
  const [decisionResult, setDecisionResult] = useState<string | null>(null);
  const [isDeciding, setIsDeciding] = useState(false);

  // Dice face rotations targeting each face: 1 (front), 6 (back), 3 (right), 4 (left), 2 (top), 5 (bottom)
  const faceRotations: Record<number, { x: number; y: number }> = {
    1: { x: 0, y: 0 },
    2: { x: -90, y: 0 },
    3: { x: 0, y: -90 },
    4: { x: 0, y: 90 },
    5: { x: 90, y: 0 },
    6: { x: 0, y: 180 },
  };

  const rollDice = () => {
    if (diceRolling) return;
    setDiceRolling(true);

    const newValues: number[] = [];
    const newRotations: { x: number; y: number }[] = [];

    for (let i = 0; i < diceCount; i++) {
      const val = Math.floor(Math.random() * 6) + 1;
      newValues.push(val);
      // Add extra full 360-degree spins for realistic physics
      const extraSpinsX = (Math.floor(Math.random() * 3) + 2) * 360;
      const extraSpinsY = (Math.floor(Math.random() * 3) + 2) * 360;
      const base = faceRotations[val];
      newRotations.push({
        x: base.x + extraSpinsX,
        y: base.y + extraSpinsY,
      });
    }

    setDiceRotations(newRotations);

    setTimeout(() => {
      setDiceValues(newValues);
      setDiceRolling(false);
    }, 1200);
  };

  const flipCoin = () => {
    if (coinFlipping) return;
    setCoinFlipping(true);

    const isHeads = Math.random() > 0.5;
    const extraRotations = 1800; // 5 full flips
    const targetDeg = extraRotations + (isHeads ? 0 : 180);

    setCoinRotation(prev => prev + targetDeg);

    setTimeout(() => {
      setCoinResult(isHeads ? 'HEADS' : 'TAILS');
      setCoinFlipping(false);
    }, 1200);
  };

  const pickRandomNumber = () => {
    const min = parseInt(minNum) || 1;
    const max = parseInt(maxNum) || 100;
    if (min >= max) {
      toast({ title: "Invalid Range", description: "Min must be smaller than Max", variant: "destructive" });
      return;
    }

    setIsPickingNum(true);
    let counter = 0;
    const interval = setInterval(() => {
      setPickedNumber(Math.floor(Math.random() * (max - min + 1)) + min);
      counter++;
      if (counter > 12) {
        clearInterval(interval);
        setIsPickingNum(false);
      }
    }, 60);
  };

  const makeDecision = () => {
    const items = decisionInput.split(',').map(s => s.trim()).filter(Boolean);
    if (items.length < 2) {
      toast({ title: "Need more options", description: "Enter at least 2 options separated by comma", variant: "destructive" });
      return;
    }

    setIsDeciding(true);
    let counter = 0;
    const interval = setInterval(() => {
      setDecisionResult(items[Math.floor(Math.random() * items.length)]);
      counter++;
      if (counter > 14) {
        clearInterval(interval);
        setIsDeciding(false);
      }
    }, 70);
  };

  // Helper dots for a dice face
  const renderDots = (num: number) => {
    const dotsMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };
    const activeDots = dotsMap[num] || [4];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-14 h-14 p-1.5 gap-1 bg-white rounded-xl shadow-inner border border-zinc-200">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {activeDots.includes(i) && (
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 shadow-sm" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-4 pb-20 pt-2">
      {/* Modes Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'dice', label: '3D Dice', icon: Dices },
          { id: 'coin', label: 'Coin Toss', icon: Coins },
          { id: 'number', label: 'Random Number', icon: Hash },
          { id: 'decision', label: 'Decision Wheel', icon: Shuffle },
        ].map(item => {
          const Icon = item.icon;
          const isActive = mode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setMode(item.id as Mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive 
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                  : 'bg-card text-muted-foreground border-border/50 hover:bg-muted'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 1. 3D DICE ROLL ── */}
      {mode === 'dice' && (
        <Card className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg flex flex-col items-center space-y-6">
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="font-bold text-sm text-foreground">3D Dice Simulator</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Physics-based realistic dice roll</p>
            </div>
            {/* Toggle 1 or 2 dice */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50 text-xs font-bold">
              <button
                onClick={() => { setDiceCount(1); setDiceValues([1]); setDiceRotations([{ x: 0, y: 0 }]); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${diceCount === 1 ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}
              >
                1 Dice
              </button>
              <button
                onClick={() => { setDiceCount(2); setDiceValues([1, 1]); setDiceRotations([{ x: 0, y: 0 }, { x: 0, y: 0 }]); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${diceCount === 2 ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}
              >
                2 Dice
              </button>
            </div>
          </div>

          {/* 3D Dice Stage */}
          <div className="flex items-center justify-center gap-8 py-8 w-full min-h-[160px] perspective-[800px]">
            {Array.from({ length: diceCount }).map((_, idx) => {
              const rot = diceRotations[idx] || { x: 0, y: 0 };
              const val = diceValues[idx] || 1;

              return (
                <motion.div
                  key={idx}
                  animate={{
                    rotateX: rot.x,
                    rotateY: rot.y,
                    scale: diceRolling ? [1, 1.25, 0.9, 1] : 1,
                  }}
                  transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                  className="cursor-pointer select-none"
                  onClick={rollDice}
                >
                  {/* Styled High-res 3D Cube representation */}
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-2xl border-2 border-zinc-300 flex items-center justify-center relative overflow-hidden transform hover:scale-105 transition-transform duration-200">
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-100 to-zinc-300 pointer-events-none" />
                    <div className="relative z-10 scale-110">
                      {renderDots(val)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Total display */}
          <div className="text-center space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {diceCount === 2 ? `Total: ${diceValues.reduce((a, b) => a + b, 0)}` : 'Outcome'}
            </span>
            <p className="text-2xl font-black text-foreground">
              {diceRolling ? 'Rolling...' : diceValues.join(' + ')}
            </p>
          </div>

          <Button
            onClick={rollDice}
            disabled={diceRolling}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 gap-2"
          >
            <RotateCw className={`w-4 h-4 ${diceRolling ? 'animate-spin' : ''}`} />
            <span>Roll Dice</span>
          </Button>
        </Card>
      )}

      {/* ── 2. COIN TOSS ── */}
      {mode === 'coin' && (
        <Card className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg flex flex-col items-center space-y-6">
          <div className="text-center">
            <h3 className="font-bold text-sm text-foreground">3D Coin Flipper</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Flip for instant decisions</p>
          </div>

          {/* 3D Coin Stage */}
          <div className="py-6 flex items-center justify-center min-h-[170px] perspective-[1000px]">
            <motion.div
              animate={{
                rotateY: coinRotation,
                y: coinFlipping ? [-20, -100, 0] : 0,
                scale: coinFlipping ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 1.2, ease: [0.25, 0.8, 0.25, 1] }}
              onClick={flipCoin}
              className="cursor-pointer select-none"
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 p-1.5 shadow-2xl border-4 border-yellow-200/80 flex items-center justify-center relative">
                <div className="w-full h-full rounded-full border-2 border-dashed border-amber-700/40 flex flex-col items-center justify-center shadow-inner bg-gradient-to-tr from-amber-400 to-yellow-300">
                  <Coins className="w-8 h-8 text-amber-900/80 mb-0.5" />
                  <span className="text-[11px] font-black tracking-widest text-amber-950 uppercase">
                    {coinResult}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Result</p>
            <p className="text-2xl font-black text-amber-500 mt-0.5">
              {coinFlipping ? 'Flipping...' : coinResult}
            </p>
          </div>

          <Button
            onClick={flipCoin}
            disabled={coinFlipping}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 gap-2"
          >
            <RotateCw className={`w-4 h-4 ${coinFlipping ? 'animate-spin' : ''}`} />
            <span>Flip Coin</span>
          </Button>
        </Card>
      )}

      {/* ── 3. RANDOM NUMBER PICKER ── */}
      {mode === 'number' && (
        <Card className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg space-y-5">
          <div>
            <h3 className="font-bold text-sm text-foreground">Random Number Generator</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Pick a random number in any custom range</p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/60 flex flex-col items-center justify-center shadow-inner min-h-[110px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Generated Number</span>
            <p className="text-4xl font-mono font-black text-primary mt-1">
              {pickedNumber !== null ? pickedNumber : '—'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Min</Label>
              <Input
                type="number"
                value={minNum}
                onChange={e => setMinNum(e.target.value)}
                className="h-11 rounded-xl text-center font-bold text-sm bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max</Label>
              <Input
                type="number"
                value={maxNum}
                onChange={e => setMaxNum(e.target.value)}
                className="h-11 rounded-xl text-center font-bold text-sm bg-background/50 border-border/50"
              />
            </div>
          </div>

          <Button
            onClick={pickRandomNumber}
            disabled={isPickingNum}
            className="w-full h-11 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Number</span>
          </Button>
        </Card>
      )}

      {/* ── 4. DECISION MAKER ── */}
      {mode === 'decision' && (
        <Card className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg space-y-5">
          <div>
            <h3 className="font-bold text-sm text-foreground">Decision Wheel</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Can't decide? Let Sutradhaar choose for you!</p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/30 flex flex-col items-center justify-center shadow-inner min-h-[110px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your Decision</span>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-300 mt-1 text-center">
              {decisionResult ? decisionResult : 'Ready to Decide'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Options (comma separated)</Label>
            <Input
              value={decisionInput}
              onChange={e => setDecisionInput(e.target.value)}
              placeholder="e.g. Pizza, Burger, Salad, Pasta"
              className="h-11 rounded-xl text-xs bg-background/50 border-border/50"
            />
          </div>

          <Button
            onClick={makeDecision}
            disabled={isDeciding}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-500/25 gap-2"
          >
            <Shuffle className="w-4 h-4" />
            <span>Pick One for Me!</span>
          </Button>
        </Card>
      )}
    </div>
  );
}
