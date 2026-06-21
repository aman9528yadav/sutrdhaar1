"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tag, Percent, DollarSign, Plus, Trash2, Package, ShoppingCart, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DiscountCalculator() {
    // Basic pricing inputs
    const [originalPrice, setOriginalPrice] = useState<number>(1000);
    const [quantity, setQuantity] = useState<number>(1);
    
    // Discount 1 settings
    const [discount1, setDiscount1] = useState<number>(10);
    const [discount1Type, setDiscount1Type] = useState<'percentage' | 'fixed'>('percentage');
    
    // Discount 2 settings
    const [discount2, setDiscount2] = useState<number>(0);
    const [discount2Type, setDiscount2Type] = useState<'percentage' | 'fixed'>('percentage');
    
    // Tax settings
    const [taxRate, setTaxRate] = useState<number>(0);
    
    // Coupon settings
    const [couponCode, setCouponCode] = useState<string>('');
    const [couponDiscount, setCouponDiscount] = useState<number>(0);
    const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
    
    // Calculation results
    const [finalPrice, setFinalPrice] = useState<number>(0);
    const [totalSavings, setTotalSavings] = useState<number>(0);
    const [taxAmount, setTaxAmount] = useState<number>(0);
    const [subTotal, setSubTotal] = useState<number>(0);
    const [discountBreakdown, setDiscountBreakdown] = useState<{name: string, amount: number}[]>([]);

    useEffect(() => {
        let price = originalPrice * quantity;
        let originalTotal = price;
        let breakdown: {name: string, amount: number}[] = [];

        // Apply first discount
        let discountAmount1 = 0;
        if (discount1Type === 'percentage') {
            discountAmount1 = price * (discount1 / 100);
        } else {
            discountAmount1 = Math.min(discount1, price);
        }
        
        if (discountAmount1 > 0) {
            price -= discountAmount1;
            breakdown.push({
                name: `Discount 1 (${discount1Type === 'percentage' ? `${discount1}%` : `₹${discount1}`})`,
                amount: discountAmount1
            });
        }

        // Apply second discount (compound on remaining amount)
        let discountAmount2 = 0;
        if (discount2Type === 'percentage') {
            discountAmount2 = price * (discount2 / 100);
        } else {
            discountAmount2 = Math.min(discount2, price);
        }
        
        if (discountAmount2 > 0) {
            price -= discountAmount2;
            breakdown.push({
                name: `Discount 2 (${discount2Type === 'percentage' ? `${discount2}%` : `₹${discount2}`})`,
                amount: discountAmount2
            });
        }

        // Apply coupon discount
        let couponDiscountAmount = 0;
        if (couponCode && couponDiscount > 0) {
            if (couponType === 'percentage') {
                couponDiscountAmount = price * (couponDiscount / 100);
            } else {
                couponDiscountAmount = Math.min(couponDiscount, price);
            }
            
            if (couponDiscountAmount > 0) {
                price -= couponDiscountAmount;
                breakdown.push({
                    name: `Coupon (${couponCode})`,
                    amount: couponDiscountAmount
                });
            }
        }

        // Calculate tax on discounted price
        const tax = price * (taxRate / 100);
        const final = price + tax;

        setSubTotal(originalTotal);
        setFinalPrice(Math.round(final));
        setTotalSavings(Math.round(originalTotal - price));
        setTaxAmount(Math.round(tax));
        setDiscountBreakdown(breakdown);
    }, [originalPrice, quantity, discount1, discount1Type, discount2, discount2Type, taxRate, couponCode, couponDiscount, couponType]);

    // Handle coupon code entry
    const applyCouponCode = () => {
        if (!couponCode.trim()) return;
        
        // Simulate coupon validation - in a real app, this would be an API call
        const upperCode = couponCode.toUpperCase();
        
        if (upperCode === 'SAVE10') {
            setCouponDiscount(10);
            setCouponType('percentage');
        } else if (upperCode === 'FLAT50') {
            setCouponDiscount(50);
            setCouponType('fixed');
        } else if (upperCode === 'BIGSALE20') {
            setCouponDiscount(20);
            setCouponType('percentage');
        } else {
            // Invalid coupon - reset
            setCouponDiscount(0);
            alert('Invalid coupon code. Try SAVE10, FLAT50, or BIGSALE20.');
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Advanced Discount Calculator</h1>
                    <p className="text-sm text-muted-foreground">Calculate final price with multiple discounts, coupons, and taxes</p>
                </div>
            </div>

            <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                {/* Input Section */}
                <Card className="bg-card border-border h-fit">
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Original Price & Quantity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label>Original Price (₹)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={originalPrice}
                                        onChange={(e) => setOriginalPrice(Number(e.target.value))}
                                        className="pl-9 text-lg font-bold"
                                        min="0"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <Label>Quantity</Label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                                        className="pl-9 text-lg font-bold"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Discount 1 */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label>First Discount</Label>
                                <div className="flex items-center gap-2">
                                    <Select value={discount1Type} onValueChange={(value: 'percentage' | 'fixed') => setDiscount1Type(value)}>
                                        <SelectTrigger className="w-[90px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">%</SelectItem>
                                            <SelectItem value="fixed">₹</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={discount1}
                                        onChange={(e) => setDiscount1(Number(e.target.value))}
                                        className="w-20 h-8 text-right font-bold text-primary border-primary/20 bg-primary/5"
                                    />
                                </div>
                            </div>
                            {discount1Type === 'percentage' && (
                                <Slider
                                    value={[discount1]}
                                    max={100}
                                    step={1}
                                    onValueChange={([v]) => setDiscount1(v)}
                                    className="py-2"
                                />
                            )}
                        </div>

                        {/* Discount 2 */}
                        <div className="space-y-4 pt-2 border-t border-border">
                            <div className="flex justify-between items-center">
                                <Label>Additional Discount</Label>
                                <div className="flex items-center gap-2">
                                    <Select value={discount2Type} onValueChange={(value: 'percentage' | 'fixed') => setDiscount2Type(value)}>
                                        <SelectTrigger className="w-[90px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">%</SelectItem>
                                            <SelectItem value="fixed">₹</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={discount2}
                                        onChange={(e) => setDiscount2(Number(e.target.value))}
                                        className="w-20 h-8 text-right font-bold text-orange-500 border-orange-500/20 bg-orange-500/5"
                                    />
                                </div>
                            </div>
                            {discount2Type === 'percentage' && (
                                <Slider
                                    value={[discount2]}
                                    max={100}
                                    step={1}
                                    onValueChange={([v]) => setDiscount2(v)}
                                    className="py-2"
                                />
                            )}
                        </div>

                        {/* Coupon Code */}
                        <div className="space-y-3 pt-2 border-t border-border">
                            <div className="flex justify-between items-center">
                                <Label>Coupon Code</Label>
                                <div className="flex gap-2 w-full max-w-[200px]">
                                    <Input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        placeholder="Enter code"
                                        className="text-right font-bold text-purple-500 border-purple-500/20 bg-purple-500/5"
                                    />
                                    <Button 
                                        type="button" 
                                        size="sm" 
                                        variant="outline"
                                        onClick={applyCouponCode}
                                        disabled={!couponCode.trim()}
                                    >
                                        <Ticket className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            {couponDiscount > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Applied: {couponCode.toUpperCase()}</span>
                                    <Badge variant="secondary">
                                        {couponType === 'percentage' ? `${couponDiscount}% OFF` : `₹${couponDiscount} OFF`}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {/* Tax */}
                        <div className="space-y-3 pt-2 border-t border-border">
                            <div className="flex justify-between items-center">
                                <Label>Tax / VAT (%)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(Math.min(100, Math.max(0, Number(e.target.value))))}
                                    className="w-20 h-8 text-right font-bold text-rose-500 border-rose-500/20 bg-rose-500/5"
                                />
                            </div>
                            <Slider
                                value={[taxRate]}
                                max={50}
                                step={0.5}
                                onValueChange={([v]) => setTaxRate(v)}
                                className="py-2"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Results Section */}
                <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Sub Total</p>
                                <p className="text-xl font-bold text-gray-700">₹{subTotal.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Total Savings</p>
                                <p className="text-xl font-bold text-emerald-500">-₹{totalSavings.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Tax Amount</p>
                                <p className="text-xl font-bold text-amber-500">₹{taxAmount.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
                            <CardContent className="p-4">
                                <p className="text-blue-100 text-xs uppercase tracking-wider mb-1">Final Price</p>
                                <p className="text-xl font-bold">₹{finalPrice.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Breakdown */}
                    <Card className="bg-card border-border overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Tag className="h-32 w-32 text-foreground" />
                        </div>
                        <CardHeader>
                            <CardTitle>Price Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-border">
                                <span>Base Price ({quantity} × ₹{originalPrice.toLocaleString()})</span>
                                <span className="font-medium">₹{subTotal.toLocaleString()}</span>
                            </div>
                            
                            <AnimatePresence>
                                {discountBreakdown.map((discount, index) => (
                                    <motion.div 
                                        key={index}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex justify-between py-2 border-b border-border last:border-0"
                                    >
                                        <span>{discount.name}</span>
                                        <span className="text-emerald-500 font-medium">-₹{Math.round(discount.amount).toLocaleString()}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            
                            {taxAmount > 0 && (
                                <div className="flex justify-between py-2 border-b border-border">
                                    <span>Tax ({taxRate}%)</span>
                                    <span className="text-amber-500 font-medium">+₹{taxAmount.toLocaleString()}</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between pt-2 text-lg font-bold">
                                <span>Total</span>
                                <span>₹{finalPrice.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
