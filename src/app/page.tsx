"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ToolsPage } from '@/components/tools-page';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { GlobalHeader } from '@/components/global-header';
import { useMaintenance } from '@/hooks/useMaintenance';
import { allTools } from '@/components/tools-page';
import { MaintenanceOverlay } from '@/components/maintenance-overlay';
import { BottomNav } from '@/components/bottom-nav';
import { DashboardSkeleton } from '@/components/dashboard-skeleton';
import { AuthPage } from '@/components/auth-page';
import { useProfile } from '@/context/ProfileContext';
import { Lock, ShieldAlert, Sparkles } from 'lucide-react';
import { AiAssistant } from '@/components/ai-assistant';
import { ChatWidget } from '@/components/chat-widget';
import { AdminInboxPage } from '@/components/admin-inbox';
import { hasUnlockedFeature, FeatureId } from '@/lib/level-system';

const DashboardPage = dynamic(() => import('@/components/dashboard-page').then(mod => ({ default: mod.DashboardPage })), { ssr: false });

const UnitConverter = dynamic(() => import('@/components/unit-converter-enhanced').then(mod => ({ default: mod.UnitConverterEnhanced })), { ssr: false });
const Calculator = dynamic(() => import('@/components/calculator').then(mod => ({ default: mod.Calculator })), { ssr: false });
const TranslatorTool = dynamic(() => import('@/components/translator-tool').then(mod => ({ default: mod.TranslatorTool })), { ssr: false });
const NotesPage = dynamic(() => import('@/components/notes-page').then(mod => ({ default: mod.NotesPage })), { ssr: false });
const TodoPage = dynamic(() => import('@/components/todo-page-modern').then(mod => ({ default: mod.TodoPageModern })), { ssr: false });
const BudgetTrackerPage = dynamic(() => import('@/components/budget-tracker-page').then(mod => ({ default: mod.BudgetTrackerPage })), { ssr: false });
const LoanCalculator = dynamic(() => import('@/components/loan-calculator-modern').then(mod => ({ default: mod.LoanCalculatorModern })), { ssr: false });
const DiscountCalculator = dynamic(() => import('@/components/discount-calculator').then(mod => ({ default: mod.DiscountCalculator })), { ssr: false });
const TimerComponent = dynamic(() => import('@/components/timer').then(mod => ({ default: mod.Timer })), { ssr: false });
const StopwatchComponent = dynamic(() => import('@/components/stopwatch-modern').then(mod => ({ default: mod.StopwatchModern })), { ssr: false });
const DateCalculator = dynamic(() => import('@/components/date-calculator').then(mod => ({ default: mod.DateCalculator })), { ssr: false });
const PasswordGenerator = dynamic(() => import('@/components/password-generator').then(mod => ({ default: mod.PasswordGenerator })), { ssr: false });
const HistoryPage = dynamic(() => import('@/components/history-page').then(mod => ({ default: mod.HistoryPage })), { ssr: false });
const AnalyticsPage = dynamic(() => import('@/components/analytics-page-enhanced').then(mod => ({ default: mod.AnalyticsPageEnhanced })), { ssr: false });
const AboutPage = dynamic(() => import('@/components/about-page').then(mod => ({ default: mod.AboutPage })), { ssr: false });
const ProfilePage = dynamic(() => import('@/components/profile-page').then(mod => ({ default: mod.ProfilePage })), { ssr: false });
const MembershipPage = dynamic(() => import('@/components/membership-page').then(mod => ({ default: mod.MembershipPage })), { ssr: false });
const SettingsPage = dynamic(() => import('@/components/settings-page').then(mod => ({ default: mod.SettingsPage })), { ssr: false });
const ProgressionPage = dynamic(() => import('@/components/progression-page').then(mod => ({ default: mod.ProgressionPage })), { ssr: false });
const WikipediaTool = dynamic(() => import('@/components/wikipedia-tool').then(mod => ({ default: mod.WikipediaTool })), { ssr: false });
import { WelcomeTour } from '@/components/welcome-tour';
import { GlobalSearchDialog } from '@/components/global-search-dialog';

export default function AppRoot() {
  const { profile, isAuthLoading, setProfile } = useProfile();
  const { maintenance, isLoading: isMaintenanceLoading } = useMaintenance();
  const [activeTool, setActiveTool] = useState<string>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const isOwner = profile.email === 'amanyadavyadav9458@gmail.com';

  const toolToFeatureId: Record<string, FeatureId> = {
    'calculator': 'calculator',
    'notes': 'notes',
    'todo': 'notes',
    'settings': 'settings',
    'converter': 'converter',
    'date-calculator': 'date_calc',
    'timer': 'timer',
    'stopwatch': 'timer',
    'analytics': 'analytics',
    'password-generator': 'password_gen',
    'budget-tracker': 'budget',
    'translator': 'translator',
    'loan-calculator': 'loan_calc',
    'discount-calculator': 'discount_calc',
    'history': 'save_history',
  };

  const renderActiveTool = () => {
    // Check if the currently active tool is in maintenance
    if (maintenance.tools?.[activeTool]?.is_maintenance) {
      const toolLabel = allTools.find(t => t.id === activeTool)?.label || activeTool;
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
          <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Under Maintenance</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {maintenance.tools[activeTool].message || `We are upgrading ${toolLabel}. Be back soon!`}
            </p>
          </div>
          <div className="w-full max-w-[200px] flex flex-col gap-3">
            <Button 
              onClick={() => setActiveTool('dashboard')}
              variant="outline"
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    const featureId = toolToFeatureId[activeTool];
    if (featureId && !hasUnlockedFeature(profile, featureId)) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
          <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center">
            <Lock className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Feature Locked</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This feature is locked. You need to reach a higher level to access it. Keep using the app to earn XP!
            </p>
          </div>
          <div className="w-full max-w-[200px] flex flex-col gap-3">
            <Button 
              onClick={() => setActiveTool('membership')}
              className="w-full bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-600 hover:to-amber-600 text-white shadow-lg shadow-purple-500/20 font-bold border-none"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Unlock Instantly
            </Button>
            <Button 
              onClick={() => setActiveTool('tools-list')}
              variant="outline"
              className="w-full"
            >
              Browse Tools
            </Button>
            <Button 
              onClick={() => setActiveTool('dashboard')}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    switch (activeTool) {
      case 'wikipedia': return <WikipediaTool />;
      case 'converter': return <UnitConverter />;
      case 'calculator': return <Calculator onToggleFullScreen={() => {}} />;
      case 'translator': return <TranslatorTool />;
      case 'notes': return <NotesPage />;
      case 'todo': return <TodoPage />;
      case 'budget-tracker': return <BudgetTrackerPage />;
      case 'loan-calculator': return <LoanCalculator />;
      case 'discount-calculator': return <DiscountCalculator />;
      case 'timer': return <TimerComponent />;
      case 'stopwatch': return <StopwatchComponent />;
      case 'date-calculator': return <DateCalculator />;
      case 'password-generator': return <PasswordGenerator />;
      case 'history': return <HistoryPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'about': return <AboutPage />;
      case 'profile': return <ProfilePage onNavigate={setActiveTool} />;
      case 'membership': return <MembershipPage />;
      case 'settings': return <SettingsPage />;
      case 'progression': return <ProgressionPage />;
      case 'admin-inbox': return <AdminInboxPage />;
      default: return null;
    }
  };

  if (isAuthLoading || isMaintenanceLoading) {
    return (
      <div className="w-full h-full flex flex-col bg-background">
        <main className="flex-1 overflow-y-auto">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  if (maintenance.isActive && !isOwner) {
    return <MaintenanceOverlay endTime={maintenance.endTime} isOwner={isOwner} message={maintenance.message} type={maintenance.type} />;
  }

  if (!profile.isAuthenticated) {
    return <AuthPage onLoginSuccess={() => setActiveTool('dashboard')} />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-background relative">
      <GlobalHeader 
        onProfileClick={() => setActiveTool('profile')} 
        onOpenSearch={() => setIsSearchOpen(true)}
      />
      <WelcomeTour onTabSelect={setActiveTool} />
      
      {maintenance.isActive && isOwner && (
        <div className="w-full bg-red-500 text-white text-xs font-bold py-2 px-4 text-center shadow-md flex items-center justify-center gap-2 shrink-0 z-50 animate-pulse">
          <ShieldAlert className="w-4 h-4" />
          <span>MAINTENANCE MODE IS ACTIVE. All other users are locked out.</span>
        </div>
      )}
      
      <main className={`flex-1 ${activeTool === 'calculator' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {activeTool === 'dashboard' && <DashboardPage onToolSelect={setActiveTool} onOpenSearch={() => setIsSearchOpen(true)} />}
        {activeTool === 'tools-list' && <ToolsPage onToolSelect={setActiveTool} />}

        {/* Calculator: full height, no scroll, back button inline */}
        {activeTool === 'calculator' && (
          <div className="h-full flex flex-col">
            <div className="px-3 py-2 flex items-center border-b border-border/50 shrink-0 bg-background">
              <Button variant="ghost" size="sm" onClick={() => setActiveTool('tools-list')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
            <div className="flex-1 overflow-hidden px-3 pb-2">
              <Calculator onToggleFullScreen={() => {}} />
            </div>
          </div>
        )}

        {/* All other tools (scrollable) */}
        {activeTool !== 'dashboard' && activeTool !== 'tools-list' && activeTool !== 'profile' && activeTool !== 'settings' && activeTool !== 'calculator' && activeTool !== 'admin-inbox' && (
            <div className="w-full flex flex-col pb-6">
              <div className="p-4 flex items-center border-b border-border/50 justify-between shrink-0 sticky top-0 bg-background z-10">
                <Button variant="ghost" size="sm" onClick={() => setActiveTool('tools-list')} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Tools
                </Button>
              </div>
              <div className="pt-4 px-4 sm:px-5">
                {renderActiveTool()}
              </div>
            </div>
        )}
        {(activeTool === 'profile' || activeTool === 'settings' || activeTool === 'admin-inbox') && (
            <div className="w-full flex flex-col flex-1">
                {renderActiveTool()}
            </div>
        )}
      </main>

      {!profile.isGuest && <AiAssistant />}
      {activeTool === 'dashboard' && <ChatWidget />}
      <BottomNav activeTab={activeTool} onTabSelect={setActiveTool} />

      <GlobalSearchDialog 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen} 
        onNavigate={setActiveTool} 
      />
    </div>
  );
}
