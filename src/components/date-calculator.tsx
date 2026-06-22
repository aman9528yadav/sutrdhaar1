
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
  Info,
  PartyPopper,
  Search
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
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    className="flex flex-col items-center justify-center p-5 bg-card/40 border border-white/10 rounded-3xl backdrop-blur-xl shadow-xl hover:bg-white/10 hover:-translate-y-1 transition-all"
  >
    <span className="text-4xl font-black tabular-nums tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-primary via-primary/80 to-primary/40 drop-shadow-sm">
      {value}
    </span>
    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-2">{label}</span>
    {subLabel && <span className="text-xs font-semibold text-muted-foreground/50 mt-1">{subLabel}</span>}
  </motion.div>
);

const DatePickerButton = ({ date, setDate, label }: { date: Date | undefined; setDate: (date: Date | undefined) => void; label: string }) => {
  const dateString = date && !isNaN(date.getTime()) ? format(date, 'yyyy-MM-dd') : '';
  return (
    <div className="w-full space-y-2 relative">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{label}</Label>
      <div className="relative">
        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
        <input 
          type="date"
          value={dateString}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              const [y, m, d] = val.split('-');
              setDate(new Date(Number(y), Number(m) - 1, Number(d)));
            } else {
              setDate(undefined);
            }
          }}
          className="w-full h-16 pl-12 pr-4 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground [color-scheme:light] dark:[color-scheme:dark] shadow-inner"
        />
      </div>
    </div>
  );
};

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

      <Button 
        size="lg" 
        className="w-full rounded-2xl h-16 text-lg font-black tracking-wide shadow-2xl hover:scale-[1.02] active:scale-95 transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-none" 
        onClick={handleCalculate}
      >
        CALCULATE DIFFERENCE
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
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{unit}</Label>
            <Input
              type="number"
              name={unit.toLowerCase()}
              value={duration[unit.toLowerCase() as keyof typeof duration] || ''}
              onChange={handleInputChange}
              placeholder="0"
              className="h-16 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10 text-center text-2xl font-black focus-visible:ring-primary/50 shadow-inner transition-all hover:bg-black/20 dark:hover:bg-white/10"
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

      <Button 
        size="lg" 
        className="w-full rounded-2xl h-16 text-lg font-black tracking-wide shadow-2xl hover:scale-[1.02] active:scale-95 transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-none" 
        onClick={calculate}
      >
        CALCULATE WORK DAYS
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

const FESTIVALS_DB = [
  // 2026
  { name: "New Year's Day", date: "2026-01-01" },
  { name: "Lohri", date: "2026-01-13" },
  { name: "Makar Sankranti / Pongal", date: "2026-01-14" },
  { name: "Guru Gobind Singh Jayanti", date: "2026-01-24" },
  { name: "Vasant Panchami", date: "2026-01-24" },
  { name: "Republic Day", date: "2026-01-26" },
  { name: "Valentine's Day", date: "2026-02-14" },
  { name: "Maha Shivaratri", date: "2026-02-15" },
  { name: "Shivaji Jayanti", date: "2026-02-19" },
  { name: "Holi", date: "2026-03-04" },
  { name: "Gudi Padwa / Ugadi", date: "2026-03-19" },
  { name: "Eid ul-Fitr", date: "2026-03-20" },
  { name: "Ram Navami", date: "2026-03-27" },
  { name: "Mahavir Jayanti", date: "2026-03-31" },
  { name: "Hanuman Jayanti", date: "2026-04-02" },
  { name: "Good Friday", date: "2026-04-03" },
  { name: "Easter", date: "2026-04-05" },
  { name: "Baisakhi", date: "2026-04-14" },
  { name: "Ambedkar Jayanti", date: "2026-04-14" },
  { name: "Buddha Purnima", date: "2026-05-01" },
  { name: "Eid ul-Adha", date: "2026-05-27" },
  { name: "Muharram", date: "2026-06-26" },
  { name: "Independence Day (US)", date: "2026-07-04" },
  { name: "Rath Yatra", date: "2026-07-16" },
  { name: "Independence Day (IN)", date: "2026-08-15" },
  { name: "Onam", date: "2026-08-27" },
  { name: "Raksha Bandhan", date: "2026-08-28" },
  { name: "Janmashtami", date: "2026-09-04" },
  { name: "Ganesh Chaturthi", date: "2026-09-14" },
  { name: "Gandhi Jayanti", date: "2026-10-02" },
  { name: "Navratri Starts", date: "2026-10-10" },
  { name: "Maha Navami", date: "2026-10-18" },
  { name: "Dussehra", date: "2026-10-19" },
  { name: "Valmiki Jayanti", date: "2026-10-26" },
  { name: "Halloween", date: "2026-10-31" },
  { name: "Diwali", date: "2026-11-08" },
  { name: "Govardhan Puja", date: "2026-11-09" },
  { name: "Bhai Dooj", date: "2026-11-10" },
  { name: "Chhath Puja", date: "2026-11-14" },
  { name: "Guru Nanak Jayanti", date: "2026-11-24" },
  { name: "Thanksgiving", date: "2026-11-26" },
  { name: "Christmas", date: "2026-12-25" },
  { name: "New Year's Eve", date: "2026-12-31" },
  
  // 2027
  { name: "New Year's Day", date: "2027-01-01" },
  { name: "Republic Day", date: "2027-01-26" },
  { name: "Maha Shivaratri", date: "2027-03-06" },
  { name: "Holi", date: "2027-03-23" },
  { name: "Ambedkar Jayanti", date: "2027-04-14" },
  { name: "Independence Day (IN)", date: "2027-08-15" },
  { name: "Gandhi Jayanti", date: "2027-10-02" },
  { name: "Diwali", date: "2027-10-29" },
  { name: "Christmas", date: "2027-12-25" },
];

function FestivalTracker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update 'now' every hour to keep "Today/Tomorrow" accurate without heavy renders
    const interval = setInterval(() => setNow(new Date()), 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  // Filter and process festivals
  const upcomingFestivals = FESTIVALS_DB
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(f => {
      const fDate = new Date(f.date + "T00:00:00");
      const diffDays = differenceInDays(fDate, new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      return { ...f, fDate, diffDays };
    })
    .filter(f => f.diffDays >= 0) // Only show future or today
    .sort((a, b) => a.fDate.getTime() - b.fDate.getTime());

  // Group by Month & Year
  const grouped: Record<string, typeof upcomingFestivals> = {};
  upcomingFestivals.forEach(f => {
    const monthKey = format(f.fDate, 'MMMM yyyy');
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(f);
  });

  const getDayBadge = (diffDays: number) => {
    if (diffDays === 0) return <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-[0_0_10px_rgba(16,185,129,0.5)]">Today!</span>;
    if (diffDays === 1) return <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Tomorrow</span>;
    if (diffDays <= 7) return <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase">In {diffDays} Days</span>;
    return <span className="bg-white/10 text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{diffDays} Days Away</span>;
  };

  return (
    <div className="space-y-6 h-full flex flex-col max-h-[500px]">
      <div className="relative shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search festivals (e.g. Diwali, Christmas)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10 text-base font-semibold focus-visible:ring-primary/50 shadow-inner"
        />
      </div>

      <ScrollArea className="flex-1 pr-4 -mr-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <PartyPopper className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No upcoming festivals found.</p>
          </div>
        ) : (
          <div className="space-y-8 pb-4">
            {Object.entries(grouped).map(([month, festivals]) => (
              <div key={month}>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-3 sticky top-0 bg-card/80 backdrop-blur-md py-1 z-10">{month}</h3>
                <div className="space-y-3">
                  {festivals.map((festival, idx) => (
                    <motion.div
                      key={festival.name + festival.date}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                    >
                      <div>
                        <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{festival.name}</h4>
                        <p className="text-sm font-medium text-muted-foreground">{format(festival.fDate, 'EEEE, MMM do')}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        {getDayBadge(festival.diffDays)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// --- Main Layout ---

export function DateCalculator() {
  const [activeTab, setActiveTab] = useState("festivals");

  const tabs = [
    { id: "difference", label: "Difference", icon: Calculator },
    { id: "add-sub", label: "Add/Sub", icon: Plus },
    { id: "age", label: "Age", icon: Baby },
    { id: "work-days", label: "Work Days", icon: Briefcase },
    { id: "countdown", label: "Countdown", icon: Clock },
    { id: "festivals", label: "Festivals", icon: PartyPopper },
    { id: "week-num", label: "Week #", icon: Hash },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-8rem)] w-full overflow-hidden rounded-3xl pb-20">
      {/* Ambient Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[100px] animate-pulse mix-blend-screen opacity-50" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/20 rounded-full blur-[100px] animate-pulse mix-blend-screen opacity-50" style={{ animationDuration: '10s' }} />
      </div>

      <div className="relative z-10 space-y-6 flex flex-col max-w-3xl mx-auto w-full p-4 md:p-6 h-full">
        <div className="flex items-center justify-between mb-2">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-foreground drop-shadow-sm">
                    Date Tools
                </h1>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Calculators & Countdowns</p>
            </div>
        </div>

        {/* Segmented Pill Navigation */}
        <div className="w-full overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex p-1.5 bg-card/40 backdrop-blur-xl border border-white/10 rounded-[2rem] w-max min-w-full shadow-lg">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-white text-black shadow-md scale-[1.02]"
                                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        )}
                    >
                        <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-black" : "text-muted-foreground")} />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-card/40 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {activeTab === "difference" && <DateDifferenceCalculator />}
                {activeTab === "add-sub" && <AddSubtractCalculator />}
                {activeTab === "age" && <AgeCalculator />}
                {activeTab === "work-days" && <WorkDaysCalculator />}
                {activeTab === "countdown" && <CountdownCalculator />}
                {activeTab === "festivals" && <FestivalTracker />}
                {activeTab === "week-num" && <WeekNumberCalculator />}
              </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
