"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Delete, Divide, Equal, Minus, Plus, X } from 'lucide-react';

export function ProgrammerCalculator() {
    const [display, setDisplay] = useState('0');
    const [activeBase, setActiveBase] = useState<'HEX' | 'DEC' | 'OCT' | 'BIN'>('DEC');
    const [expression, setExpression] = useState('');

    const handleInput = (value: string) => {
        if (display === '0') {
            setDisplay(value);
        } else {
            setDisplay(display + value);
        }
    };

    const handleBackspace = () => {
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    };

    const handleClear = () => {
        setDisplay('0');
        setExpression('');
    };

    const getValue = () => {
        try {
            switch (activeBase) {
                case 'HEX': return parseInt(display, 16);
                case 'OCT': return parseInt(display, 8);
                case 'BIN': return parseInt(display, 2);
                default: return parseInt(display, 10);
            }
        } catch {
            return 0;
        }
    };

    const value = getValue();

    const hex = value.toString(16).toUpperCase();
    const dec = value.toString(10);
    const oct = value.toString(8);
    const bin = value.toString(2);

    const isBitwiseOp = (op: string) => ['&', '|', '^', '<<', '>>'].includes(op);

    const handleOperator = (op: string) => {
        setExpression(`${value} ${op} `);
        setDisplay('0');
    };

    const handleEquals = () => {
        if (!expression) return;
        const parts = expression.split(' ');
        const op = parts[1];
        const val1 = parseInt(parts[0]);
        const val2 = value;

        let res = 0;
        switch (op) {
            case '+': res = val1 + val2; break;
            case '-': res = val1 - val2; break;
            case '*': res = val1 * val2; break;
            case '/': res = Math.floor(val1 / val2); break;
            case '&': res = val1 & val2; break;
            case '|': res = val1 | val2; break;
            case '^': res = val1 ^ val2; break;
            case '<<': res = val1 << val2; break;
            case '>>': res = val1 >> val2; break;
        }

        setDisplay(res.toString(activeBase === 'HEX' ? 16 : activeBase === 'OCT' ? 8 : activeBase === 'BIN' ? 2 : 10).toUpperCase());
        setExpression('');
    };

    const CalcBtn = ({ label, onClick, disabled = false, className }: any) => (
        <Button
            variant="secondary"
            className={cn("h-12 text-lg font-semibold", className)}
            onClick={onClick}
            disabled={disabled}
        >
            {label}
        </Button>
    );

    return (
        <div className="space-y-4">
            {/* Display Area */}
            <div className="bg-slate-950 p-4 rounded-xl space-y-2 font-mono text-sm">
                <div
                    className={cn("flex justify-between cursor-pointer p-1 rounded hover:bg-white/5", activeBase === 'HEX' && "bg-primary/20 text-primary")}
                    onClick={() => setActiveBase('HEX')}
                >
                    <span>HEX</span>
                    <span>{hex}</span>
                </div>
                <div
                    className={cn("flex justify-between cursor-pointer p-1 rounded hover:bg-white/5", activeBase === 'DEC' && "bg-primary/20 text-primary")}
                    onClick={() => setActiveBase('DEC')}
                >
                    <span>DEC</span>
                    <span>{dec}</span>
                </div>
                <div
                    className={cn("flex justify-between cursor-pointer p-1 rounded hover:bg-white/5", activeBase === 'OCT' && "bg-primary/20 text-primary")}
                    onClick={() => setActiveBase('OCT')}
                >
                    <span>OCT</span>
                    <span>{oct}</span>
                </div>
                <div
                    className={cn("flex justify-between cursor-pointer p-1 rounded hover:bg-white/5", activeBase === 'BIN' && "bg-primary/20 text-primary")}
                    onClick={() => setActiveBase('BIN')}
                >
                    <span>BIN</span>
                    <span className="break-all text-right pl-4">{bin}</span>
                </div>
            </div>

            {/* Expression Display */}
            <div className="h-8 text-right text-muted-foreground text-sm font-mono">
                {expression}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-6 gap-2">
                {/* Row 1 */}
                <CalcBtn label="A" onClick={() => handleInput('A')} disabled={activeBase !== 'HEX'} />
                <CalcBtn label="<<" onClick={() => handleOperator('<<')} className="text-xs" />
                <CalcBtn label=">>" onClick={() => handleOperator('>>')} className="text-xs" />
                <CalcBtn label="C" onClick={handleClear} className="bg-red-500/20 text-red-500 hover:bg-red-500/30" />
                <CalcBtn label={<Delete className="w-4 h-4" />} onClick={handleBackspace} className="bg-red-500/20 text-red-500 hover:bg-red-500/30" />
                <CalcBtn label="/" onClick={() => handleOperator('/')} className="bg-primary/20 text-primary" />

                {/* Row 2 */}
                <CalcBtn label="B" onClick={() => handleInput('B')} disabled={activeBase !== 'HEX'} />
                <CalcBtn label="(" disabled />
                <CalcBtn label=")" disabled />
                <CalcBtn label="7" onClick={() => handleInput('7')} disabled={activeBase === 'BIN'} />
                <CalcBtn label="8" onClick={() => handleInput('8')} disabled={['BIN', 'OCT'].includes(activeBase)} />
                <CalcBtn label="9" onClick={() => handleInput('9')} disabled={['BIN', 'OCT'].includes(activeBase)} />

                {/* Row 3 */}
                <CalcBtn label="C" onClick={() => handleInput('C')} disabled={activeBase !== 'HEX'} />
                <CalcBtn label="AND" onClick={() => handleOperator('&')} className="text-xs" />
                <CalcBtn label="OR" onClick={() => handleOperator('|')} className="text-xs" />
                <CalcBtn label="4" onClick={() => handleInput('4')} disabled={activeBase === 'BIN'} />
                <CalcBtn label="5" onClick={() => handleInput('5')} disabled={activeBase === 'BIN'} />
                <CalcBtn label="6" onClick={() => handleInput('6')} disabled={activeBase === 'BIN'} />

                {/* Row 4 */}
                <CalcBtn label="D" onClick={() => handleInput('D')} disabled={activeBase !== 'HEX'} />
                <CalcBtn label="XOR" onClick={() => handleOperator('^')} className="text-xs" />
                <CalcBtn label="NOT" disabled className="text-xs" />
                <CalcBtn label="1" onClick={() => handleInput('1')} />
                <CalcBtn label="2" onClick={() => handleInput('2')} disabled={activeBase === 'BIN'} />
                <CalcBtn label="3" onClick={() => handleInput('3')} disabled={activeBase === 'BIN'} />

                {/* Row 5 */}
                <CalcBtn label="E" onClick={() => handleInput('E')} disabled={activeBase !== 'HEX'} />
                <CalcBtn label="F" onClick={() => handleInput('F')} disabled={activeBase !== 'HEX'} />
                <CalcBtn label="0" onClick={() => handleInput('0')} className="col-span-2" />
                <CalcBtn label="=" onClick={handleEquals} className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white" />
            </div>
        </div>
    );
}
