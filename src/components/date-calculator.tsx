
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar as CalendarIcon,
  ArrowRight,
  Copy,
  Share2,
  Minus,
  Plus,
  Briefcase,
  Clock,
  Baby,
  Calculator,
  CalendarDays,
  Hash,
  Info
} from 'lucide-react';
import {
  format,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  add,
  sub,
  intervalToDuration,
  isWeekend,
  getWeek,
  isLeapYear,
  getDayOfYear,
  nextSaturday,
  nextSunday,
  startOfYear,
  endOfYear
} from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Label } from './ui/label';
import { useProfile } from '@/context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Utility Components ---

const ResultCard = ({ value, label, subLabel, delay = 0 }: { value: string | number; label: string; subLabel?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors"
  >
    <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-primary to-primary/60">
      {value}
    </span>
    <span className="text-sm font-medium text-muted-foreground mt-1">{label}</span>
    {subLabel && <span className="text-xs text-muted-foreground/60 mt-0.5">{subLabel}</span>}
  </motion.div>
);

const DatePickerButton = ({ date, setDate, label }: { date: Date | undefined; setDate: (date: Date | undefined) => void; label: string }) => (
  <div className="w-full space-y-2">
    <Label>{label}</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full h-12 justify-start text-left font-normal border-border bg-muted hover:bg-accent hover:text-accent-foreground rounded-xl",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date && !isNaN(date.getTime()) ? format(date, "PPP") : <span>{label}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          captionLayout="dropdown-buttons"
          fromYear={1900}
          toYear={2100}
          className="bg-card text-foreground rounded-md border-border"
        />
      </PopoverContent>
    </Popover>
  </div>
);

// --- Feature Components ---

function DateDifferenceCalculator() {
  const { toast } = useToast();
  const { profile, addDateCalculationToHistory, addXP } = useProfile();
  const dateHistory = profile.history?.filter(h => h.type === 'date_calculation' && h.calculationType === 'Difference') || [];
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [result, setResult] = useState<any>(null);

  const handleCalculate = () => {
    if (startDate && endDate) {
      if (endDate < startDate) {
        toast({ title: 'Invalid Dates', description: 'End date cannot be earlier than start date.', variant: 'destructive' });
        return;
      }

      const duration = intervalToDuration({ start: startDate, end: endDate });
      const totalDays = differenceInDays(endDate, startDate);
      const totalWeeks = Math.floor(totalDays / 7);
      const remainingDays = totalDays % 7;

      // Calculate total hours/minutes for fun
      const totalHours = totalDays * 24;
      const totalMinutes = totalHours * 60;

      const newResult = {
        years: duration.years || 0,
        months: duration.months || 0,
        weeks: totalWeeks,
        days: duration.days || 0,
        totalDays,
        totalHours,
        totalMinutes
      };

      setResult(newResult);
      addDateCalculationToHistory({
        calculationType: 'Difference',
        details: { startDate: format(startDate, 'PPP'), endDate: format(endDate, 'PPP'), result: newResult }
      });
      addXP?.(1, 'Calculated Date Difference');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DatePickerButton date={startDate} setDate={setStartDate} label="Start Date" />
        <DatePickerButton date={endDate} setDate={setEndDate} label="End Date" />
      </div>

      <Button size="lg" className="w-full rounded-xl h-12 text-base font-semibold shadow-lg shadow-primary/20" onClick={handleCalculate}>
        Calculate Difference
      </Button>

      {/* In-Line History Tape */}
      {dateHistory.length > 0 && (
        <div className="w-full overflow-x-auto no-scrollbar py-2 mt-2 -mb-2 flex justify-start">
           <div className="flex gap-2 w-max items-center">
             {dateHistory.slice(0, 5).map(item => (
               <button
                 key={item.id}
                 onClick={(e) => {
                     e.preventDefault();
                     if (item.details.startDate) {
                       const sDate = new Date(item.details.startDate);
                       if (!isNaN(sDate.getTime())) setStartDate(sDate);
                     }
                     if (item.details.endDate) {
                       const eDate = new Date(item.details.endDate);
                       if (!isNaN(eDate.getTime())) setEndDate(eDate);
                     }
                     setResult(item.details.result);
                 }}
                 className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground transition-colors shrink-0 flex flex-col items-start gap-0.5"
                 title={`${item.details.startDate} - ${item.details.endDate}`}
               >
                 <span className="font-semibold text-foreground">{item.details.result.years}Y {item.details.result.months}M {item.details.result.days}D</span>
                 <span className="text-[9px] text-muted-foreground/60">{item.details.startDate.split(',')[0]} ➔ {item.details.endDate.split(',')[0]}</span>
               </button>
             ))}
           </div>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ResultCard value={result.years} label="Years" delay={0.1} />
              <ResultCard value={result.months} label="Months" delay={0.2} />
              <ResultCard value={result.days} label="Days" delay={0.3} />
              <ResultCard value={result.totalDays} label="Total Days" delay={0.4} />
            </div>
            <div className="p-4 bg-accent/30 rounded-xl border border-white/5 text-center space-y-1">
              <p className="text-sm text-muted-foreground">Alternative units</p>
              <p className="font-medium">{result.totalWeeks} weeks and {result.days} days</p>
              <p className="text-xs text-muted-foreground/60">{result.totalHours.toLocaleString()} hours • {result.totalMinutes.toLocaleString()} minutes</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddSubtractCalculator() {
  const { addDateCalculationToHistory } = useProfile();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [resultDate, setResultDate] = useState<Date>(new Date());
  const [operation, setOperation] = useState<'add' | 'sub'>('add');
  const [duration, setDuration] = useState({ years: 0, months: 0, weeks: 0, days: 0 });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDuration(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  useEffect(() => {
    if (!startDate) return;
    let newDate = startDate;
    const durationObj = {
      years: duration.years,
      months: duration.months,
      weeks: duration.weeks,
      days: duration.days
    };

    if (operation === 'add') {
      newDate = add(startDate, durationObj);
    } else {
      newDate = sub(startDate, durationObj);
    }
    setResultDate(newDate);
  }, [startDate, duration, operation]);

  return (
    <div className="space-y-6">
      <DatePickerButton date={startDate} setDate={setStartDate} label="Start Date" />

      <div className="flex p-1 bg-accent/20 rounded-xl">
        <button
          onClick={() => setOperation('add')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all",
            operation === 'add' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-white/5"
          )}
        >
          <Plus className="h-4 w-4" /> Add
        </button>
        <button
          onClick={() => setOperation('sub')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all",
            operation === 'sub' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-white/5"
          )}
        >
          <Minus className="h-4 w-4" /> Subtract
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Years', 'Months', 'Weeks', 'Days'].map((unit) => (
          <div key={unit} className="space-y-2">
            <Label className="text-xs text-muted-foreground">{unit}</Label>
            <Input
              type="number"
              name={unit.toLowerCase()}
              value={duration[unit.toLowerCase() as keyof typeof duration] || ''}
              onChange={handleInputChange}
              placeholder="0"
              className="h-12 rounded-xl bg-black/5 dark:bg-white/5 border-white/10 text-center text-lg font-medium focus-visible:ring-primary/50"
            />
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/10 text-center relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Result Date</h3>
          <p className="text-3xl font-bold text-foreground">{format(resultDate, 'PPP')}</p>
          <p className="text-sm text-primary mt-1">{format(resultDate, 'eeee')}</p>
        </div>
      </div>
    </div>
  );
}

function AgeCalculator() {
  const { addDateCalculationToHistory } = useProfile();
  const [birthDate, setBirthDate] = useState<Date | undefined>(new Date(2000, 0, 1));
  const [age, setAge] = useState<any>(null);

  const getZodiacSign = (day: number, month: number) => {
    const zodiacSigns = [
      { sign: "Capricorn", endDay: 19 },
      { sign: "Aquarius", endDay: 18 },
      { sign: "Pisces", endDay: 20 },
      { sign: "Aries", endDay: 19 },
      { sign: "Taurus", endDay: 20 },
      { sign: "Gemini", endDay: 20 },
      { sign: "Cancer", endDay: 22 },
      { sign: "Leo", endDay: 22 },
      { sign: "Virgo", endDay: 22 },
      { sign: "Libra", endDay: 22 },
      { sign: "Scorpio", endDay: 21 },
      { sign: "Sagittarius", endDay: 21 },
      { sign: "Capricorn", endDay: 31 }
    ];
    // Month is 0-indexed in Date, but usually 1-indexed for logic. Let's use 0-indexed.
    // Actually, let's just use the month directly.
    // If day <= endDay, it's the sign of the current month index. Else next month.

    // Adjust for 0-indexed month (0 = Jan, 1 = Feb, etc.)
    let signIndex = month;
    if (day > zodiacSigns[month].endDay) {
      signIndex = (month + 1) % 12;
    }
    return zodiacSigns[signIndex].sign;
  };

  useEffect(() => {
    if (birthDate) {
      const today = new Date();
      const duration = intervalToDuration({ start: birthDate, end: today });
      const totalDays = differenceInDays(today, birthDate);

      // Next Birthday
      const currentYear = today.getFullYear();
      let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
      if (nextBirthday < today) {
        nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
      }
      const daysToBirthday = differenceInDays(nextBirthday, today);

      const zodiac = getZodiacSign(birthDate.getDate(), birthDate.getMonth());

      setAge({
        years: duration.years || 0,
        months: duration.months || 0,
        days: duration.days || 0,
        totalDays,
        nextBirthday: format(nextBirthday, 'PPP'),
        daysToBirthday,
        zodiac
      });
    }
  }, [birthDate]);

  return (
    <div className="space-y-6">
      <DatePickerButton date={birthDate} setDate={setBirthDate} label="Date of Birth" />

      {age && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <ResultCard value={age.years} label="Years" delay={0.1} />
            <ResultCard value={age.months} label="Months" delay={0.2} />
            <ResultCard value={age.days} label="Days" delay={0.3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider">Next Birthday</p>
                <p className="text-lg font-bold text-foreground mt-1">{age.nextBirthday}</p>
                <p className="text-sm text-muted-foreground">in {age.daysToBirthday} days</p>
              </div>
              <Baby className="h-8 w-8 text-indigo-400 opacity-50" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-purple-400 uppercase tracking-wider">Zodiac Sign</p>
                <p className="text-2xl font-bold text-foreground mt-1">{age.zodiac}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">
                {age.zodiac[0]}
              </div>
            </motion.div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            You have been alive for <span className="font-bold text-foreground">{age.totalDays.toLocaleString()}</span> days!
          </div>
        </div>
      )}
    </div>
  );
}

function WorkDaysCalculator() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(add(new Date(), { days: 7 }));
  const [workDays, setWorkDays] = useState<number | null>(null);

  const calculate = () => {
    if (startDate && endDate) {
      if (endDate < startDate) {
        toast({ title: "Invalid Dates", description: "End date cannot be before start date.", variant: "destructive" });
        return;
      }
      let count = 0;
      let currentDate = startDate;
      while (currentDate <= endDate) {
        if (!isWeekend(currentDate)) {
          count++;
        }
        currentDate = add(currentDate, { days: 1 });
      }
      setWorkDays(count);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DatePickerButton date={startDate} setDate={setStartDate} label="Start Date" />
        <DatePickerButton date={endDate} setDate={setEndDate} label="End Date" />
      </div>

      <Button size="lg" className="w-full rounded-xl h-12" onClick={calculate}>
        Calculate Work Days
      </Button>

      <AnimatePresence>
        {workDays !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl text-center"
          >
            <Briefcase className="h-8 w-8 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Working Days</h3>
            <p className="text-5xl font-black text-foreground mt-2">{workDays}</p>
            <p className="text-sm text-muted-foreground mt-2">Excluding weekends (Sat & Sun)</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CountdownCalculator() {
  const [targetDate, setTargetDate] = useState<Date | undefined>(add(new Date(), { days: 30 }));
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => {
      const now = new Date();
      if (targetDate > now) {
        const duration = intervalToDuration({ start: now, end: targetDate });
        setTimeLeft({
          days: duration.days || 0,
          hours: duration.hours || 0,
          minutes: duration.minutes || 0,
          seconds: duration.seconds || 0
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="space-y-6">
      <DatePickerButton date={targetDate} setDate={setTargetDate} label="Target Event Date" />

      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <ResultCard value={String(timeLeft.days).padStart(2, '0')} label="Days" />
        <ResultCard value={String(timeLeft.hours).padStart(2, '0')} label="Hrs" />
        <ResultCard value={String(timeLeft.minutes).padStart(2, '0')} label="Mins" />
        <ResultCard value={String(timeLeft.seconds).padStart(2, '0')} label="Secs" />
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">Countdown to {targetDate ? format(targetDate, 'PPP') : '...'}</p>
      </div>
    </div>
  );
}

function WeekNumberCalculator() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    if (date) {
      setInfo({
        weekNumber: getWeek(date),
        dayOfYear: getDayOfYear(date),
        isLeap: isLeapYear(date),
        isWeekend: isWeekend(date),
        dayName: format(date, 'EEEE')
      });
    }
  }, [date]);

  return (
    <div className="space-y-6">
      <DatePickerButton date={date} setDate={setDate} label="Select Date" />

      {info && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col items-center justify-center text-center">
            <Hash className="h-6 w-6 text-blue-400 mb-2" />
            <span className="text-xs font-medium text-blue-400 uppercase">Week Number</span>
            <span className="text-4xl font-bold text-foreground mt-1">{info.weekNumber}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex flex-col items-center justify-center text-center">
            <CalendarDays className="h-6 w-6 text-orange-400 mb-2" />
            <span className="text-xs font-medium text-orange-400 uppercase">Day of Year</span>
            <span className="text-4xl font-bold text-foreground mt-1">{info.dayOfYear}</span>
          </motion.div>

          <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-3">
            <div className="p-3 bg-white/5 rounded-xl text-center border border-white/10">
              <span className="block text-xs text-muted-foreground">Leap Year</span>
              <span className={cn("font-semibold", info.isLeap ? "text-green-500" : "text-red-500")}>{info.isLeap ? "Yes" : "No"}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl text-center border border-white/10">
              <span className="block text-xs text-muted-foreground">Is Weekend</span>
              <span className={cn("font-semibold", info.isWeekend ? "text-green-500" : "text-red-500")}>{info.isWeekend ? "Yes" : "No"}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl text-center border border-white/10">
              <span className="block text-xs text-muted-foreground">Day</span>
              <span className="font-semibold">{info.dayName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Layout ---

export function DateCalculator() {
  const [activeTab, setActiveTab] = useState("difference");

  const tabs = [
    { id: "difference", label: "Difference", icon: Calculator },
    { id: "add-sub", label: "Add/Sub", icon: Plus },
    { id: "age", label: "Age", icon: Baby },
    { id: "work-days", label: "Work Days", icon: Briefcase },
    { id: "countdown", label: "Countdown", icon: Clock },
    { id: "week-num", label: "Week #", icon: Hash },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600">
                  Date Tools
              </h1>
              <p className="text-muted-foreground mt-1">Calculators and countdowns</p>
          </div>
      </div>

      <Card className="bg-background/60 backdrop-blur-xl border-border shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex justify-center">
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex space-x-2 px-4 justify-center min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                        : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <div className="mt-4 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "difference" && <DateDifferenceCalculator />}
                {activeTab === "add-sub" && <AddSubtractCalculator />}
                {activeTab === "age" && <AgeCalculator />}
                {activeTab === "work-days" && <WorkDaysCalculator />}
                {activeTab === "countdown" && <CountdownCalculator />}
                {activeTab === "week-num" && <WeekNumberCalculator />}
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
