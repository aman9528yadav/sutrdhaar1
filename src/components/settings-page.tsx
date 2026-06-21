"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';
import { useMaintenance } from '@/hooks/useMaintenance';
import { allTools } from '@/components/tools-page';
import { useChangelog, AboutConfig, RoadmapItem } from '@/hooks/useChangelog';
import { supabase } from '@/lib/supabase';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Palette, 
  LayoutDashboard, 
  Database, 
  Info, 
  ShieldAlert, 
  ChevronRight, 
  ArrowLeft,
  Sliders,
  Moon, 
  Sun, 
  Monitor, 
  Droplets, 
  Sparkles, 
  Star, 
  Cloud, 
  Leaf, 
  Hexagon,
  History as HistoryIcon,
  EyeOff,
  Bell,
  Ticket,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { EditWidgetsDialog } from './edit-widgets-dialog';
import { FaqManager } from './faq-manager';
import { Download, Upload, Trash2, HelpCircle } from 'lucide-react';
import { hasUnlockedFeature } from '@/lib/level-system';
import { useToast } from '@/hooks/use-toast';

const appThemes = [
  { id: 'light', label: 'Light', icon: Sun, preview: 'bg-white border-gray-200' },
  { id: 'theme-arctic', label: 'Arctic', icon: Droplets, preview: 'bg-cyan-50 border-cyan-200' },
  { id: 'theme-lavender', label: 'Lavender', icon: Sparkles, preview: 'bg-purple-50 border-purple-200' },
  { id: 'dark', label: 'Dark', icon: Moon, preview: 'bg-zinc-900 border-zinc-700' },
  { id: 'theme-midnight', label: 'Midnight', icon: Star, preview: 'bg-slate-900 border-blue-700' },
  { id: 'theme-nebula', label: 'Nebula', icon: Cloud, preview: 'bg-purple-950 border-purple-700' },
  { id: 'theme-emerald', label: 'Emerald', icon: Leaf, preview: 'bg-emerald-950 border-emerald-700' },
  { id: 'theme-slate', label: 'Slate', icon: Monitor, preview: 'bg-slate-800 border-slate-600' },
  { id: 'theme-sutradhaar', label: 'Sutradhaar', icon: Hexagon, preview: 'bg-violet-950 border-violet-700' },
];

// Reusable settings card wrapper
function SettingRow({ icon: Icon, iconColor, title, description, children }: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-border/30 bg-card/40 backdrop-blur-xl transition-colors hover:bg-card/60">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div className={`p-2.5 rounded-xl bg-${iconColor.split('-')[0]}-500/10 shrink-0`}
          style={{ background: `hsl(var(--${iconColor === 'primary' ? 'primary' : 'card'}) / 0.15)` }}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>}
        </div>
      </div>
      {children && <div className="shrink-0 ml-3">{children}</div>}
    </div>
  );
}

export function SettingsPage({ onClose }: { onClose?: () => void }) {
  const { profile, setProfile, deleteAllUserData, updateDashboardWidgets, subscribeToPushNotifications } = useProfile();
  const { maintenance } = useMaintenance();
  const { changelog, version, aboutConfig, globalNotifications, isLoading, updateChangelog, updateAboutConfig, addGlobalNotification, deleteGlobalNotification } = useChangelog();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeAdvancedCategory, setActiveAdvancedCategory] = useState<string | null>(null);
  
  const [localAboutConfig, setLocalAboutConfig] = React.useState<AboutConfig | null>(null);

  React.useEffect(() => {
    if (!isLoading && aboutConfig) {
      setLocalAboutConfig(aboutConfig);
    }
  }, [aboutConfig, isLoading]);
  
  const [customDays, setCustomDays] = useState('0');
  const [customHours, setCustomHours] = useState('0');
  const [customMinutes, setCustomMinutes] = useState('0');
  const [customMessage, setCustomMessage] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<'update' | 'bugfix' | 'checkup' | 'none'>('none');
  const [isEditWidgetsOpen, setIsEditWidgetsOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // For code generator
  const [genTier, setGenTier] = useState<'standard' | 'premium'>('standard');
  const [assignName, setAssignName] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [adminCodes, setAdminCodes] = useState<any[]>([]);

  const handleGenerateCode = async () => {
    const code = 'SUTRA-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const { error } = await supabase.from('membership_codes').insert({
      code,
      tier: genTier,
      is_used: false,
      assigned_name: assignName.trim() || null,
      assigned_email: assignEmail.trim() || null,
      duration_days: parseInt(durationDays) || 30
    });

    if (error) {
      alert("Failed to generate code: " + error.message);
      return;
    }

    setGeneratedCode(code);
    fetchAdminCodes();
    setAssignName('');
    setAssignEmail('');
  };

  const fetchAdminCodes = async () => {
    const { data } = await supabase.from('membership_codes').select('*').order('created_at', { ascending: false });
    if (data) setAdminCodes(data);
  };

  const handleRevokeCode = async (codeId: string) => {
    if (!window.confirm("Are you sure you want to revoke this code? It will be deleted permanently.")) return;
    const { error } = await supabase.from('membership_codes').delete().eq('id', codeId);
    if (!error) fetchAdminCodes();
    else alert("Failed to revoke: " + error.message);
  };

  React.useEffect(() => {
    if (activeAdvancedCategory === 'codes') {
      fetchAdminCodes();
    }
  }, [activeAdvancedCategory]);

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `sutradhaar_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    setProfile(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        lastBackupDate: new Date().toISOString(),
        backupLogs: [
          { date: new Date().toISOString(), type: 'export' as const },
          ...(prev.settings?.backupLogs || [])
        ].slice(0, 10)
      }
    }));
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      try {
        const content = e.target?.result as string;
        const parsedProfile = JSON.parse(content);
        if (parsedProfile && typeof parsedProfile === 'object') {
          const updatedLogs = [
            { date: new Date().toISOString(), type: 'import' as const },
            ...(parsedProfile.settings?.backupLogs || [])
          ].slice(0, 10);
          
          if (!parsedProfile.settings) parsedProfile.settings = {};
          parsedProfile.settings.backupLogs = updatedLogs;

          // @ts-ignore
          setProfile(parsedProfile);
          alert('Backup imported successfully!');
        }
      } catch (err) {
        alert('Failed to import backup. Invalid file format.');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all app data? This action cannot be undone.')) {
        deleteAllUserData();
        alert('All app data has been cleared.');
    }
  };

  const handleThemeChange = (newTheme: string) => {
    if (!hasUnlockedFeature(profile, 'themes') && newTheme !== 'dark' && newTheme !== 'light') {
      toast({ title: 'Feature Locked', description: 'Reach Level 2 to unlock custom themes', variant: 'destructive' });
      return;
    }
    setTheme(newTheme);
  };

  const handleSaveHistory = () => {
    if (!hasUnlockedFeature(profile, 'save_history')) {
      toast({ title: 'Feature Locked', description: 'Reach Level 3 to toggle Save History', variant: 'destructive' });
      return;
    }
    setProfile(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        saveHistory: !prev.settings.saveHistory
      }
    }));
  };

  const handleMaintenanceToggle = async () => {
    const newActiveState = !maintenance.isActive;
    const { error } = await supabase
      .from('maintenance')
      .upsert({ 
        id: true, 
        is_active: newActiveState, 
        end_time: maintenance.endTime || null,
        message: maintenance.message || null,
        type: maintenanceType === 'none' ? null : maintenanceType
      });
      
    if (error) {
      console.error("Supabase write error:", error);
      alert("Failed to update maintenance mode. Error: " + error.message);
    }
  };

  const handleSetTimer = async (hours: number) => {
    const { error } = await supabase
      .from('maintenance')
      .upsert({ 
        id: true, 
        is_active: true, 
        end_time: Date.now() + (hours * 60 * 60 * 1000),
        message: customMessage.trim() || null,
        type: maintenanceType === 'none' ? null : maintenanceType
      });
      
    if (error) {
      alert("Failed to set timer. Error: " + error.message);
    }
  };

  const handleCustomTimer = async () => {
    const d = parseInt(customDays) || 0;
    const h = parseInt(customHours) || 0;
    const m = parseInt(customMinutes) || 0;
    const totalHours = (d * 24) + h + (m / 60);
    
    const { error } = await supabase
      .from('maintenance')
      .upsert({ 
        id: true, 
        is_active: true, 
        end_time: totalHours > 0 ? Date.now() + (totalHours * 60 * 60 * 1000) : (maintenance.endTime || null),
        message: customMessage.trim() || null,
        type: maintenanceType === 'none' ? null : maintenanceType
      });
      
    if (error) {
      alert("Failed to update maintenance settings. Error: " + error.message);
    }
  };

  const handleToolMaintenanceToggle = async (toolId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('tool_maintenance')
      .upsert({ tool_id: toolId, is_maintenance: !currentState });
      
    if (error) {
      alert("Failed to update tool maintenance. Error: " + error.message);
    }
  };

  // Only working categories
  const categories = [
    { id: 'appearance', label: 'Appearance', icon: Palette, iconColor: 'text-emerald-400', desc: 'Theme & visual style' },
    { id: 'dashboard', label: 'Dashboard Widgets', icon: LayoutDashboard, iconColor: 'text-cyan-400', desc: 'Show, hide & reorder' },
    { id: 'preferences', label: 'Preferences', icon: Sliders, iconColor: 'text-purple-400', desc: 'History & behavior' },
    { id: 'ai', label: 'AI Configuration', icon: Sparkles, iconColor: 'text-amber-400', desc: 'Gemini AI setup' },
    { id: 'data', label: 'Data Management', icon: Database, iconColor: 'text-indigo-400', desc: 'Backup & restore' },
    { id: 'about', label: 'About', icon: Info, iconColor: 'text-blue-400', desc: 'Version & credits' },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert, iconColor: 'text-red-500', isDanger: true, desc: 'Clear all data' },
  ];

  const isOwner = profile.email === 'amanyadavyadav9458@gmail.com';
  if (isOwner) {
    categories.push({ id: 'advanced', label: 'Advanced Settings', icon: Sliders, iconColor: 'text-yellow-500', desc: 'Maintenance & announcements' });
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!activeCategory ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto pb-24 px-4 pt-4"
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Customize your Sutradhaar experience</p>
            </div>

            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer bg-card/40 backdrop-blur-xl hover:scale-[1.01] active:scale-[0.99] ${
                    cat.isDanger ? 'border-red-500/20 hover:bg-red-500/5' : 'border-border/30 hover:bg-card/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl border border-border/30 ${cat.isDanger ? 'bg-red-500/10' : 'bg-card/60'}`}>
                      <cat.icon className={`w-5 h-5 ${cat.iconColor}`} />
                    </div>
                    <div>
                      <span className={`font-semibold text-sm ${cat.isDanger ? 'text-red-500' : 'text-foreground'}`}>
                        {cat.label}
                      </span>
                      {cat.desc && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{cat.desc}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${cat.isDanger ? 'text-red-500/50' : 'text-muted-foreground'}`} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-2xl mx-auto pb-24 px-4 pt-4 h-full overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={() => {
                if (activeAdvancedCategory) setActiveAdvancedCategory(null);
                else setActiveCategory(null);
              }} className="shrink-0 rounded-full h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {categories.find(c => c.id === activeCategory)?.label}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {categories.find(c => c.id === activeCategory)?.desc}
                </p>
              </div>
            </div>

            {/* ── Appearance ── */}
            {activeCategory === 'appearance' && (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">Choose a theme that fits your style.</p>
                <div className="grid grid-cols-3 gap-3">
                  {appThemes.map((t) => (
                    <motion.button 
                      key={t.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleThemeChange(t.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                        theme === t.id 
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-2 ring-primary/20' 
                          : 'border-border/30 bg-card/40 backdrop-blur-xl hover:bg-card/60'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl ${t.preview} border mb-3 shadow-sm`} />
                      <t.icon className={`w-5 h-5 mb-2 ${theme === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-semibold ${theme === t.id ? 'text-primary' : 'text-foreground'}`}>{t.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Dashboard Widgets ── */}
            {activeCategory === 'dashboard' && (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Control which widgets appear on your dashboard. Toggle visibility and drag to reorder.
                </p>

                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4 border border-cyan-500/20">
                    <LayoutDashboard className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Widget Manager</h3>
                  <p className="text-muted-foreground text-sm text-center mb-6 max-w-[280px]">
                    Drag to reorder, toggle to show/hide sections on your dashboard.
                  </p>
                  <Button 
                    onClick={() => setIsEditWidgetsOpen(true)} 
                    className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 font-semibold px-6"
                  >
                    <Sliders className="w-4 h-4 mr-2" /> Customize Widgets
                  </Button>
                </div>

                {/* Quick toggle preview */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Quick Toggle</h4>
                  {(profile.dashboardWidgets || []).map(widget => {
                    const labels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
                      todo: { label: 'Tasks', icon: LayoutDashboard, color: 'text-green-500' },
                      notes: { label: 'Notes', icon: LayoutDashboard, color: 'text-yellow-500' },
                      budget: { label: 'Spending Pulse', icon: LayoutDashboard, color: 'text-emerald-500' },
                      history: { label: 'Activity Heatmap', icon: LayoutDashboard, color: 'text-blue-500' },
                      favorites: { label: 'Favorites', icon: LayoutDashboard, color: 'text-amber-500' },
                    };
                    const info = labels[widget.id] || { label: widget.id, icon: LayoutDashboard, color: 'text-muted-foreground' };

                    return (
                      <div key={widget.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/30 bg-card/40 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                          {widget.hidden ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-primary" />
                          )}
                          <span className={`text-sm font-medium ${widget.hidden ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {info.label}
                          </span>
                        </div>
                        <Switch
                          checked={!widget.hidden}
                          onCheckedChange={(checked) => {
                            const updated = (profile.dashboardWidgets || []).map(w =>
                              w.id === widget.id ? { ...w, hidden: !checked } : w
                            );
                            updateDashboardWidgets(updated);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Preferences ── */}
            {activeCategory === 'preferences' && (
              <div className="space-y-3">
                <SettingRow
                  icon={HistoryIcon}
                  iconColor="text-blue-400"
                  title="Save History"
                  description="Store calculation & conversion history"
                >
                  <Switch 
                    checked={profile.settings?.saveHistory ?? true} 
                    onCheckedChange={handleSaveHistory}
                  />
                </SettingRow>

                <SettingRow
                  icon={Bell}
                  iconColor="text-amber-500"
                  title="Push Notifications"
                  description="Receive bill reminders and alerts even when the app is closed"
                >
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold"
                      onClick={() => subscribeToPushNotifications()}
                    >
                      Enable
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                      onClick={async () => {
                        const { data } = await supabase.auth.getUser();
                        if (data?.user) {
                          fetch('/api/send-push', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId: data.user.id,
                              title: "Test Alert",
                              message: "Web Push Notifications are working perfectly! 🎉"
                            })
                          });
                        }
                      }}
                    >
                      Test Alert
                    </Button>
                  </div>
                </SettingRow>
              </div>
            )}

            {/* ── Data Management ── */}
            {activeCategory === 'data' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center pt-4 pb-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
                    <Database className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold">App Data Backup</h3>
                  <p className="text-muted-foreground text-sm mt-2 mb-6 max-w-[280px]">
                    Export or import your entire app profile and data.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <Button onClick={handleExportBackup} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-semibold">
                      <Download className="w-4 h-4 mr-2" /> Export Data
                    </Button>
                    <input 
                      type="file" 
                      accept=".json" 
                      ref={fileInputRef} 
                      onChange={handleImportBackup} 
                      className="hidden" 
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 font-semibold">
                      <Upload className="w-4 h-4 mr-2" /> Import Data
                    </Button>
                  </div>

                  {profile.settings?.backupLogs && profile.settings.backupLogs.length > 0 && (
                    <div className="mt-8 w-full max-w-sm text-left bg-card/40 p-4 rounded-xl border border-border/30">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Backup History</h4>
                      <div className="space-y-2">
                        {profile.settings.backupLogs.map((log, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              {log.type === 'export' ? <Download className="w-3 h-3 text-emerald-400" /> : <Upload className="w-3 h-3 text-blue-400" />}
                              <span className="capitalize font-medium">{log.type}</span>
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {new Date(log.date).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Danger Zone ── */}
            {activeCategory === 'danger' && (
              <div className="flex flex-col items-center justify-center pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-red-500">Clear All Data</h3>
                <p className="text-muted-foreground text-sm mt-2 mb-6 max-w-[280px]">
                  Permanently delete all your data including todos, notes, history, budget, and settings. This cannot be undone.
                </p>
                
                <Button onClick={handleClearData} className="w-full max-w-sm bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 shadow-lg shadow-red-500/10 font-semibold">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear All App Data
                </Button>
              </div>
            )}

            {/* ── AI ── */}
            {activeCategory === 'ai' && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 px-1 mb-2">
                  <div className="p-2 rounded-xl bg-amber-500/10">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">AI Configuration</h3>
                    <p className="text-sm text-muted-foreground">Power your app with free Google Gemini AI</p>
                  </div>
                </div>
                
                <Card className="bg-card/40 backdrop-blur-xl border-border/30 shadow-lg rounded-3xl overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">Gemini API Key</h4>
                      <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
                        To use AI features like smart translation, task breakdown, and note summarization, you need a free Gemini API key. 
                        Get yours for free at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 font-medium hover:underline">Google AI Studio</a>.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Input
                        type="password"
                        placeholder="Paste your Gemini API key (AIzaSy...)"
                        value={profile.settings.geminiApiKey || ''}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          settings: { ...prev.settings, geminiApiKey: e.target.value }
                        }))}
                        className="bg-background/50 border-border/50 h-12 rounded-xl px-4 focus-visible:ring-amber-500/50"
                      />
                      <p className="text-[10px] text-muted-foreground/80 pl-1">
                        Your key is stored securely in your browser's local storage and is never sent anywhere except directly to Google's API.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── About ── */}
            {activeCategory === 'about' && (
              <div className="space-y-5 max-w-lg mx-auto">
                <div className="flex flex-col items-center justify-center pt-4 pb-4 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <Hexagon className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Sutradhaar</h3>
                  <p className="text-muted-foreground text-sm mt-1 mb-2">Version {version || '1.0.0'}</p>
                  <p className="text-xs text-muted-foreground/60">
                    Made with ❤️ by <span className="font-semibold text-foreground/80">Aman Yadav</span>
                  </p>
                </div>
                
                <div className="w-full space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-14 bg-card/40 backdrop-blur-xl border-border/30 hover:bg-card/60 transition-all rounded-2xl">
                        <Sparkles className="w-5 h-5 mr-3 text-amber-500" />
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-sm">What's New</span>
                          <span className="text-[10px] text-muted-foreground">Changelog & latest features</span>
                        </div>
                        <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border/30">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-500" /> What's New
                        </DialogTitle>
                        <DialogDescription>
                          Latest updates and features added to Sutradhaar.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Update {version || '1.0.0'}
                          </h4>
                          <ul className="text-sm text-muted-foreground list-disc pl-6 space-y-1">
                            {changelog ? (
                              changelog.split('\n').filter(line => line.trim() !== '').map((item, index) => (
                                <li key={index}>{item.replace(/^-\s*/, '')}</li>
                              ))
                            ) : (
                              <li>Loading latest features...</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-14 bg-card/40 backdrop-blur-xl border-border/30 hover:bg-card/60 transition-all rounded-2xl">
                        <Info className="w-5 h-5 mr-3 text-blue-500" />
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-sm">About Sutradhaar</span>
                          <span className="text-[10px] text-muted-foreground">App information & credits</span>
                        </div>
                        <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border/30 text-center">
                      <DialogHeader>
                        <DialogTitle className="text-center">About Sutradhaar</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
                          <Hexagon className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-lg">Sutradhaar</h4>
                          <p className="text-sm text-muted-foreground">Your personal productivity & finance companion.</p>
                        </div>
                        <div className="text-xs text-muted-foreground/60 space-y-1 mt-4">
                          <p>Version {version || '1.0.0'}</p>
                          <p>Designed and built with ❤️ by <span className="font-semibold text-foreground/80">Aman Yadav</span></p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}

            {/* ── Advanced (Owner Only) ── */}
            {activeCategory === 'advanced' && isOwner && (
              <div className="space-y-4 pb-10">
                {!activeAdvancedCategory ? (
                  <div className="space-y-2">
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveAdvancedCategory('maintenance')}
                      className="flex items-center justify-between p-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-red-500/10">
                          <ShieldAlert className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">Maintenance Lockout</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Control app access and lock screens</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>

                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveAdvancedCategory('announcements')}
                      className="flex items-center justify-between p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-amber-500/10">
                          <Sparkles className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">App Announcements</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Publish What's New & changelogs</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>

                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveAdvancedCategory('aboutConfig')}
                      className="flex items-center justify-between p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-blue-500/10">
                          <Info className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">About Page Config</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Edit stats and roadmap items</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>

                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveAdvancedCategory('notifications')}
                      className="flex items-center justify-between p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10">
                          <Bell className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">Global Notifications</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Send alerts to all users</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>

                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveAdvancedCategory('codes')}
                      className="flex items-center justify-between p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10">
                          <Ticket className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">Membership Codes</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Generate activation codes</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>

                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveAdvancedCategory('faqs')}
                      className="flex items-center justify-between p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-purple-500/10">
                          <HelpCircle className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">Support FAQs</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Manage live chat Help Center</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    {activeAdvancedCategory === 'maintenance' && (
                      <div className="space-y-4">
                        <h2 className="text-sm font-bold text-red-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" />
                          Maintenance Lockout
                        </h2>
                        <div className="p-5 rounded-3xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl shadow-lg shadow-red-500/5 space-y-6">
                          <div className="flex items-center justify-between pb-5 border-b border-red-500/10">
                            <div>
                              <Label htmlFor="maintenance" className="font-bold text-foreground cursor-pointer text-base">Enable Maintenance</Label>
                              <p className="text-xs text-muted-foreground mt-1">Locks out all users except the owner.</p>
                            </div>
                            <Switch 
                              id="maintenance" 
                              checked={maintenance.isActive} 
                              onCheckedChange={handleMaintenanceToggle} 
                              className="data-[state=checked]:bg-red-500"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Maintenance Mode Type</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant={maintenanceType === 'none' ? 'default' : 'outline'} size="sm" onClick={() => setMaintenanceType('none')} className={`border-border/30 ${maintenanceType === 'none' ? 'bg-primary/20 text-primary hover:bg-primary/30' : ''}`}>General</Button>
                              <Button variant={maintenanceType === 'update' ? 'default' : 'outline'} size="sm" onClick={() => setMaintenanceType('update')} className={`border-border/30 ${maintenanceType === 'update' ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30' : ''}`}>System Update</Button>
                              <Button variant={maintenanceType === 'bugfix' ? 'default' : 'outline'} size="sm" onClick={() => setMaintenanceType('bugfix')} className={`border-border/30 ${maintenanceType === 'bugfix' ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30' : ''}`}>Bug Fixes</Button>
                              <Button variant={maintenanceType === 'checkup' ? 'default' : 'outline'} size="sm" onClick={() => setMaintenanceType('checkup')} className={`border-border/30 ${maintenanceType === 'checkup' ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : ''}`}>Routine Checkup</Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Public Lock Screen Message</Label>
                            <Input 
                              placeholder="Our platform is currently undergoing..." 
                              value={customMessage}
                              onChange={(e) => setCustomMessage(e.target.value)}
                              className="h-11 text-sm bg-background/30 border-border/30 rounded-xl"
                            />
                          </div>
                          
                          <div className="space-y-4 pt-5 border-t border-red-500/10">
                            <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Estimated Downtime</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleSetTimer(1)} className="border-border/30 h-10 rounded-xl">1 Hour</Button>
                              <Button variant="outline" size="sm" onClick={() => handleSetTimer(4)} className="border-border/30 h-10 rounded-xl">4 Hours</Button>
                              <Button variant="outline" size="sm" onClick={() => handleSetTimer(24)} className="border-border/30 h-10 rounded-xl">24 Hours</Button>
                            </div>

                            <div className="flex items-end gap-2 bg-background/20 p-4 rounded-2xl border border-border/30 shadow-inner">
                              <div className="flex-1 space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground uppercase font-bold pl-1">Days</Label>
                                <Input type="number" min="0" value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder="0" className="h-10 text-sm bg-background/30 border-border/30 rounded-xl text-center" />
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground uppercase font-bold pl-1">Hrs</Label>
                                <Input type="number" min="0" max="23" value={customHours} onChange={(e) => setCustomHours(e.target.value)} placeholder="0" className="h-10 text-sm bg-background/30 border-border/30 rounded-xl text-center" />
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground uppercase font-bold pl-1">Mins</Label>
                                <Input type="number" min="0" max="59" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="0" className="h-10 text-sm bg-background/30 border-border/30 rounded-xl text-center" />
                              </div>
                              <Button variant="secondary" size="sm" onClick={handleCustomTimer} className="h-10 shrink-0 border-border/30 rounded-xl px-4 font-bold">Set</Button>
                            </div>
                            {maintenance.endTime && maintenance.isActive && (
                              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center justify-center">
                                <p className="text-xs text-red-400 font-medium text-center">
                                  Ends at: {new Date(maintenance.endTime).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Targeted Tool Maintenance */}
                        <div className="p-5 rounded-3xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl shadow-lg shadow-blue-500/5 space-y-4">
                          <div>
                            <Label className="font-bold text-foreground text-base">Targeted Tool Maintenance</Label>
                            <p className="text-xs text-muted-foreground mt-1">Lock specific features without taking the app down.</p>
                          </div>
                          
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {allTools.map((tool) => {
                              const isToolActive = maintenance.tools?.[tool.id]?.is_maintenance || false;
                              return (
                                <div key={tool.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/30 bg-card/40">
                                  <div className="flex items-center gap-3">
                                    <tool.icon className={`w-4 h-4 ${isToolActive ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                    <span className={`text-sm font-medium ${isToolActive ? 'text-blue-500' : 'text-foreground'}`}>
                                      {tool.label}
                                    </span>
                                  </div>
                                  <Switch
                                    checked={isToolActive}
                                    onCheckedChange={() => handleToolMaintenanceToggle(tool.id, isToolActive)}
                                    className="data-[state=checked]:bg-blue-500"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAdvancedCategory === 'codes' && (
                      <div className="space-y-4">
                        <h2 className="text-sm font-bold text-indigo-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                          <Ticket className="w-4 h-4" />
                          Code Generator
                        </h2>
                        <div className="p-5 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-xl shadow-lg shadow-indigo-500/5 space-y-6">
                          <div className="flex items-center justify-between pb-5 border-b border-indigo-500/10">
                            <div>
                              <Label className="font-bold text-foreground cursor-pointer text-base">Generate New Code</Label>
                              <p className="text-xs text-muted-foreground mt-1">Create an instant upgrade code.</p>
                            </div>
                            <Button onClick={handleGenerateCode} className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-xl">
                              Generate Code
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Assign To (Optional)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input 
                                placeholder="User Name (e.g. Aman)" 
                                value={assignName}
                                onChange={e => setAssignName(e.target.value)}
                                className="h-10 text-sm bg-background/30 border-border/30 rounded-xl"
                              />
                              <Input 
                                placeholder="Email Address" 
                                value={assignEmail}
                                onChange={e => setAssignEmail(e.target.value)}
                                className="h-10 text-sm bg-background/30 border-border/30 rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Membership Tier & Duration</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <Button variant={genTier === 'standard' ? 'default' : 'outline'} size="sm" onClick={() => setGenTier('standard')} className={`border-border/30 ${genTier === 'standard' ? 'bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/30' : ''}`}>Standard</Button>
                              <Button variant={genTier === 'premium' ? 'default' : 'outline'} size="sm" onClick={() => setGenTier('premium')} className={`border-border/30 ${genTier === 'premium' ? 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30' : ''}`}>Premium</Button>
                              <Input 
                                type="number"
                                placeholder="Days (e.g. 30)" 
                                value={durationDays}
                                onChange={e => setDurationDays(e.target.value)}
                                className="h-9 text-sm bg-background/30 border-border/30 rounded-md"
                              />
                            </div>
                          </div>

                          {generatedCode && (
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-center">
                              <p className="text-xs text-muted-foreground mb-1">Generated Code (Share this with the user)</p>
                              <p className="text-2xl font-mono font-bold text-indigo-400">{generatedCode}</p>
                            </div>
                          )}

                          <div className="space-y-4 pt-5 border-t border-indigo-500/10">
                            <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Recent Codes</Label>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {adminCodes.map((c, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-background/40 border border-border/30 rounded-xl">
                                  <div>
                                    <p className="font-mono font-bold text-sm">{c.code}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{c.tier} Tier • {c.duration_days || 30} Days</p>
                                    {(c.assigned_name || c.assigned_email) && (
                                      <p className="text-[10px] text-indigo-400 mt-1 flex items-center gap-1">
                                        Assigned to: {c.assigned_name} {c.assigned_email ? `(${c.assigned_email})` : ''}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right flex flex-col items-end gap-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.is_used ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                      {c.is_used ? 'Used' : 'Available'}
                                    </span>
                                    {c.is_used && <p className="text-[10px] text-muted-foreground">{c.used_by}</p>}
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-red-500 hover:bg-red-500/10 hover:text-red-600" onClick={() => handleRevokeCode(c.id)}>
                                      Revoke
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAdvancedCategory === 'announcements' && (
                      <div className="space-y-4">
                        <h2 className="text-sm font-bold text-amber-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          App Announcements
                        </h2>
                        <div className="p-5 rounded-3xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl shadow-lg shadow-amber-500/5 space-y-5">
                          <div className="flex items-center justify-between pb-4 border-b border-amber-500/10">
                            <div>
                              <Label className="font-bold text-foreground text-base">"What's New" Popup</Label>
                              <p className="text-xs text-muted-foreground mt-1">Updates live for all users.</p>
                            </div>
                            <Button size="sm" className="bg-amber-500 text-black hover:bg-amber-600 shadow-lg shadow-amber-500/20 font-bold rounded-xl" onClick={() => {
                              const textArea = document.getElementById('changelog-input') as HTMLTextAreaElement;
                              const versionInput = document.getElementById('version-input') as HTMLInputElement;
                              if (textArea && versionInput) {
                                updateChangelog(versionInput.value, textArea.value);
                                alert('Changelog & Version updated successfully!');
                              }
                            }}>
                              Publish Now
                            </Button>
                          </div>
                          
                          <div className="space-y-4 pt-1">
                            <div className="space-y-2">
                              <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Version Number</Label>
                              <Input 
                                id="version-input"
                                defaultValue={version || '1.0.0'}
                                placeholder="e.g. 1.0.1" 
                                className="h-10 text-sm bg-background/30 border-border/30 rounded-xl max-w-[150px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Changelog Notes</Label>
                              <textarea 
                                id="changelog-input"
                                defaultValue={changelog}
                                placeholder="- Added new feature&#10;- Fixed bug" 
                                className="w-full h-40 p-4 text-sm bg-background/30 border border-border/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none font-mono text-muted-foreground leading-relaxed"
                              />
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest pl-2">Each new line creates a bullet point</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAdvancedCategory === 'aboutConfig' && (
                      <div className="space-y-4">
                        <h2 className="text-sm font-bold text-blue-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          About Page Configuration
                        </h2>
                        <div className="p-5 rounded-3xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl shadow-lg shadow-blue-500/5 space-y-5">
                          <div className="flex items-center justify-between pb-4 border-b border-blue-500/10">
                            <div>
                              <Label className="font-bold text-foreground text-base">App Statistics</Label>
                              <p className="text-xs text-muted-foreground mt-1">Updates live on the About Page.</p>
                            </div>
                            <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 font-bold rounded-xl" onClick={() => {
                              if (localAboutConfig) {
                                updateAboutConfig(localAboutConfig);
                                alert('About Page Config updated successfully!');
                              }
                            }}>
                              Save Changes
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 pt-1">
                            <div className="space-y-2">
                              <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Happy Users</Label>
                              <Input 
                                value={localAboutConfig?.happyUsers || ''}
                                onChange={(e) => setLocalAboutConfig(prev => prev ? {...prev, happyUsers: e.target.value} : null)}
                                placeholder="e.g. 10k+" 
                                className="h-10 text-sm bg-background/30 border-border/30 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Calculations Done</Label>
                              <Input 
                                value={localAboutConfig?.calculationsDone || ''}
                                onChange={(e) => setLocalAboutConfig(prev => prev ? {...prev, calculationsDone: e.target.value} : null)}
                                placeholder="e.g. 1M+" 
                                className="h-10 text-sm bg-background/30 border-border/30 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Rating</Label>
                              <Input 
                                value={localAboutConfig?.rating || ''}
                                onChange={(e) => setLocalAboutConfig(prev => prev ? {...prev, rating: e.target.value} : null)}
                                placeholder="e.g. 4.9" 
                                className="h-10 text-sm bg-background/30 border-border/30 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Uptime</Label>
                              <Input 
                                value={localAboutConfig?.uptime || ''}
                                onChange={(e) => setLocalAboutConfig(prev => prev ? {...prev, uptime: e.target.value} : null)}
                                placeholder="e.g. 99.9%" 
                                className="h-10 text-sm bg-background/30 border-border/30 rounded-xl"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Roadmap Section */}
                        <div className="p-5 rounded-3xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-xl shadow-lg shadow-purple-500/5 space-y-5">
                          <div className="flex items-center justify-between pb-4 border-b border-purple-500/10">
                            <div>
                              <Label className="font-bold text-foreground text-base">Roadmap Items</Label>
                              <p className="text-xs text-muted-foreground mt-1">Manage future plans and updates.</p>
                            </div>
                            <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10 font-bold rounded-xl" onClick={() => {
                              const newItem: RoadmapItem = {
                                id: Date.now(),
                                title: 'New Update',
                                date: 'TBD',
                                version: 'v1.1',
                                status: 'planned',
                                icon: 'Sparkles',
                                description: 'Description here...',
                                details: ['Feature 1', 'Feature 2']
                              };
                              setLocalAboutConfig(prev => prev ? {...prev, roadmap: [...prev.roadmap, newItem]} : null);
                            }}>
                              + Add Item
                            </Button>
                          </div>

                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {localAboutConfig?.roadmap.map((item, idx) => (
                              <div key={item.id} className="p-4 bg-background/40 border border-border/30 rounded-2xl space-y-3 relative">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute top-2 right-2 h-6 w-6 text-red-500 hover:bg-red-500/10"
                                  onClick={() => {
                                    setLocalAboutConfig(prev => prev ? {...prev, roadmap: prev.roadmap.filter(r => r.id !== item.id)} : null);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                <div className="grid grid-cols-2 gap-3 pr-8">
                                  <Input 
                                    value={item.title} 
                                    onChange={(e) => {
                                      const updated = [...localAboutConfig.roadmap];
                                      updated[idx] = { ...item, title: e.target.value };
                                      setLocalAboutConfig({ ...localAboutConfig, roadmap: updated });
                                    }}
                                    placeholder="Title" className="h-8 text-xs bg-background/50" 
                                  />
                                  <Input 
                                    value={item.version} 
                                    onChange={(e) => {
                                      const updated = [...localAboutConfig.roadmap];
                                      updated[idx] = { ...item, version: e.target.value };
                                      setLocalAboutConfig({ ...localAboutConfig, roadmap: updated });
                                    }}
                                    placeholder="Version" className="h-8 text-xs bg-background/50" 
                                  />
                                  <Input 
                                    value={item.date} 
                                    onChange={(e) => {
                                      const updated = [...localAboutConfig.roadmap];
                                      updated[idx] = { ...item, date: e.target.value };
                                      setLocalAboutConfig({ ...localAboutConfig, roadmap: updated });
                                    }}
                                    placeholder="Date (e.g. Q4 2024)" className="h-8 text-xs bg-background/50" 
                                  />
                                  <select 
                                    value={item.status}
                                    onChange={(e) => {
                                      const updated = [...localAboutConfig.roadmap];
                                      updated[idx] = { ...item, status: e.target.value as any };
                                      setLocalAboutConfig({ ...localAboutConfig, roadmap: updated });
                                    }}
                                    className="h-8 text-xs bg-background/50 border-border/30 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  >
                                    <option value="completed">Completed</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="planned">Planned</option>
                                  </select>
                                </div>
                                <Input 
                                  value={item.description} 
                                  onChange={(e) => {
                                    const updated = [...localAboutConfig.roadmap];
                                    updated[idx] = { ...item, description: e.target.value };
                                    setLocalAboutConfig({ ...localAboutConfig, roadmap: updated });
                                  }}
                                  placeholder="Description" className="h-8 text-xs bg-background/50" 
                                />
                                <Input 
                                  value={item.details.join(', ')} 
                                  onChange={(e) => {
                                    const updated = [...localAboutConfig.roadmap];
                                    updated[idx] = { ...item, details: e.target.value.split(',').map(s => s.trim()) };
                                    setLocalAboutConfig({ ...localAboutConfig, roadmap: updated });
                                  }}
                                  placeholder="Features (comma separated)" className="h-8 text-xs bg-background/50" 
                                />
                              </div>
                            ))}
                            {(!localAboutConfig?.roadmap || localAboutConfig.roadmap.length === 0) && (
                              <p className="text-center text-xs text-muted-foreground py-4">No roadmap items. Add one!</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAdvancedCategory === 'notifications' && (
                      <div className="space-y-4">
                        <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          Global Notifications
                        </h2>
                        <div className="p-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl shadow-lg shadow-emerald-500/5 space-y-5">
                          <div className="flex items-center justify-between pb-4 border-b border-emerald-500/10">
                            <div>
                              <Label className="font-bold text-foreground text-base">Broadcast Message</Label>
                              <p className="text-xs text-muted-foreground mt-1">Send a real-time notification to the app header.</p>
                            </div>
                            <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 font-bold rounded-xl" onClick={async () => {
                              if (!customMessage.trim()) return alert('Please enter a message');
                              const success = await addGlobalNotification({ title: 'Admin Broadcast', message: customMessage });
                              if (success) {
                                setCustomMessage('');
                                alert('Global Notification sent successfully!');
                              } else {
                                alert('Failed to send notification. Please try again.');
                              }
                            }}>
                              Send
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Message Content</Label>
                            <Input 
                              value={customMessage}
                              onChange={(e) => setCustomMessage(e.target.value)}
                              placeholder="Type your announcement here..." 
                              className="h-10 text-sm bg-background/30 border-border/30 rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="p-5 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg space-y-4">
                          <h3 className="font-semibold text-sm">Notification History</h3>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {globalNotifications?.length > 0 ? (
                              globalNotifications.map(notif => (
                                <div key={notif.id} className="p-4 rounded-xl border border-border/30 bg-background/50 flex items-center justify-between group">
                                  <div>
                                    <p className="font-medium text-sm">{notif.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-2">{new Date(notif.timestamp).toLocaleString()}</p>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                    onClick={() => deleteGlobalNotification(notif.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-4">No notifications have been broadcasted yet.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAdvancedCategory === 'faqs' && (
                      <FaqManager />
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <EditWidgetsDialog open={isEditWidgetsOpen} onOpenChange={setIsEditWidgetsOpen} />
    </div>
  );
}
