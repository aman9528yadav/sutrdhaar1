

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { isToday, differenceInCalendarDays, startOfDay, isYesterday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { calculateLevelFromXP } from '@/lib/level-system';
import { Button } from '@/components/ui/button';
import { useDebouncedCallback } from 'use-debounce';


export type ActivityType = 'conversion' | 'calculator' | 'date_calculation' | 'translation';

export type ActivityLogItem = {
  timestamp: string;
  type: ActivityType;
};

export type ConversionHistoryItem = {
  id: string;
  type: 'conversion';
  fromValue: string;
  fromUnit: string;
  toValue: string;
  toUnit: string;
  category: string;
  timestamp: string; // Use ISO string for serialization
};

export type CalculatorHistoryItem = {
  id: string;
  type: 'calculator';
  expression: string;
  result: string;
  timestamp: string; // Use ISO string for serialization
};

export type DateCalculationHistoryItem = {
  id: string;
  type: 'date_calculation';
  calculationType: string;
  details: any;
  timestamp: string;
};

export type FavoriteItem = {
  id: string;
  type: 'favorite';
  fromValue: string;
  fromUnit: string;
  toValue: string;
  toUnit: string;
  category: string;
};

export type TranslationHistoryItem = {
  id: string;
  type: 'translation';
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
};

export type HistoryItem = ConversionHistoryItem | CalculatorHistoryItem | DateCalculationHistoryItem | TranslationHistoryItem;

export type UserStats = {
  allTimeActivities: number;
  todayActivities: number;
  lastActivityDate: string | null;
  lastAppOpenDate: string | null;
  streak: number;
  daysActive: number;
  xp: number;
  level: number;
};

export type NoteItem = {
  id: string;
  title: string;
  content: string;
  category?: string;
  color?: string;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isTrashed?: boolean;
  isArchived?: boolean;
};

export type SubTask = {
  id: string;
  text: string;
  completed: boolean;
};

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
  subtasks?: SubTask[];
  createdAt: string;
  completedAt?: string;
  recurring?: 'daily' | 'weekly' | 'monthly';
  timeSpent?: number; // in seconds
};

export type QuickAccessItemOrder = {
  id: string;
  hidden: boolean;
};

export type DashboardWidgetId = 'todo' | 'notes' | 'budget' | 'history' | 'favorites';

export type DashboardWidgetItem = {
  id: DashboardWidgetId;
  hidden: boolean;
  size: 'small' | 'large';
};

export type DashboardLayoutItem = {
  id: 'stats' | 'weeklySummary' | 'quickAccess' | 'widgets' | 'whatsNew' | 'comingSoon' | 'about';
  hidden: boolean;
};


export type HSLColor = {
  h: number;
  s: number;
  l: number;
};

export type CustomTheme = {
  background: HSLColor;
  foreground: HSLColor;
  primary: HSLColor;
  accent: HSLColor;
};

export type UserSettings = {
  saveHistory: boolean;
  customTheme?: CustomTheme;
  enableNotifications: boolean;
  enableSounds: boolean;
  notePassword?: string;
  geminiApiKey?: string;
  lastBackupDate?: string;
  hasSeenWelcomeTour?: boolean;
  // New privacy and security settings
  enableBiometricAuth?: boolean;
  appLockTimeout?: number; // in minutes
  privateBrowsingMode?: boolean;
  
  // New accessibility settings
  textSizeScale?: number; // scale factor for text
  highContrastMode?: boolean;
  reduceMotion?: boolean;
  
  // New notification settings
  notificationCategories?: {
    reminders?: boolean;
    updates?: boolean;
    achievements?: boolean;
  };
  doNotDisturbHours?: {
    enabled?: boolean;
    start?: string; // HH:MM format
    end?: string; // HH:MM format
  };
  reminderFrequency?: 'daily' | 'weekly' | 'monthly';
  enableEmailNotifications?: boolean;
  backupLogs?: { date: string; type: 'export' | 'import' }[];
  readNotificationIds?: string[];
  dismissedNotificationIds?: string[];
};

export type Membership = 'guest' | 'member' | 'premium' | 'owner';

export type CustomUnit = {
  id: string;
  name: string;
  symbol: string;
  categoryId: string;
  factor: number;
  standard: string;
};

export type CustomCategory = {
  id: string;
  name: string;
}

export type Account = {
  id: string;
  name: string;
  balance: number;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  budgetLimit?: number;
};

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  categoryId: string;
  accountId: string;
  date: string; // ISO string
  notes?: string;
  tags?: string[];
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    nextDue: string;
  };
  receiptUrl?: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
};

export type BillReminder = {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  frequency: 'monthly' | 'yearly' | 'once';
  isPaid: boolean;
};

export type Budget = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  goals: SavingsGoal[];
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
};


export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  birthday: string;
  skills: string[];
  socialLinks: {
    linkedin: string;
    twitter: string;
    github: string;
    instagram: string;
  };
  membership: Membership;
  settings: UserSettings;
  stats: UserStats;
  notes: NoteItem[];
  todos: TodoItem[];
  activityLog: ActivityLogItem[];
  quickAccessOrder?: QuickAccessItemOrder[];
  dashboardWidgets?: DashboardWidgetItem[];
  dashboardLayout?: DashboardLayoutItem[];
  isAuthenticated?: boolean;
  isGuest?: boolean;
  photoUrl?: string;
  photoId?: string;
  history: HistoryItem[];
  favorites: FavoriteItem[];
  customUnits: CustomUnit[];
  customCategories: CustomCategory[];
  budget: Budget;
  billReminders: BillReminder[];
  notifications?: NotificationItem[];
  trialClaimedAt?: string;
  membershipExpiresAt?: string;
};

type ProfileContextType = {
  profile: UserProfile;
  setProfile: (profile: UserProfile | ((prevState: UserProfile) => UserProfile)) => void;
  checkAndUpdateStreak: () => void;
  isLoading: boolean;
  addNote: (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (note: NoteItem) => void;
  deleteNote: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTodo: (todo: TodoItem) => void;
  deleteTodo: (id: string) => void;
  deleteAllUserData: () => Promise<void>;
  updateStats: (type: ActivityType) => void;
  addXP: (amount: number, reason: string) => void;
  history: HistoryItem[];
  favorites: FavoriteItem[];
  addConversionToHistory: (item: Omit<ConversionHistoryItem, 'id' | 'type' | 'timestamp'>) => void;
  addCalculatorToHistory: (item: Omit<CalculatorHistoryItem, 'id' | 'type' | 'timestamp'>) => void;
  addDateCalculationToHistory: (item: Omit<DateCalculationHistoryItem, 'id' | 'type' | 'timestamp'>) => void;
  addTranslationToHistory: (item: Omit<TranslationHistoryItem, 'id' | 'type' | 'timestamp'>) => void;
  addFavorite: (item: Omit<FavoriteItem, 'id' | 'type'>) => void;
  deleteHistoryItem: (id: string) => void;
  deleteFavorite: (id: string) => void;
  clearAllHistory: (type: 'conversion' | 'calculator' | 'date_calculation' | 'all') => void;
  clearAllFavorites: () => void;
  addCustomUnit: (unit: Omit<CustomUnit, 'id'>) => void;
  updateCustomUnit: (unit: CustomUnit) => void;
  deleteCustomUnit: (id: string) => void;
  getCustomUnitBySymbol: (symbol: string) => CustomUnit | undefined;
  getCustomCategoryById: (id: string) => CustomCategory | undefined;
  logout: () => void;
  isAuthLoading: boolean;
  isGuest: boolean;
  addCustomCategory: (name: string) => void;
  updateCustomCategory: (category: CustomCategory) => void;
  deleteCustomCategory: (id: string) => void;
  // Budget functions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  transferBetweenAccounts: (fromAccountId: string, toAccountId: string, amount: number) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  updateSavingsGoal: (goal: SavingsGoal) => void;
  deleteSavingsGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, accountId: string) => void;
  // Bill Reminder functions
  addBillReminder: (reminder: Omit<BillReminder, 'id'>) => void;
  updateBillReminder: (reminder: BillReminder) => void;
  deleteBillReminder: (id: string) => void;
  subscribeToPushNotifications: () => Promise<void>;
  updateDashboardWidgets: (widgets: DashboardWidgetItem[]) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const defaultStats: UserStats = {
  allTimeActivities: 0,
  todayActivities: 0,
  lastActivityDate: null,
  lastAppOpenDate: null,
  streak: 0,
  daysActive: 0,
  xp: 0,
  level: 1,
};

export const defaultSettings: UserSettings = {
  saveHistory: true,
  enableNotifications: true,
  enableSounds: true,
  readNotificationIds: [],
  dismissedNotificationIds: [],
  customTheme: {
    background: { h: 0, s: 0, l: 100 },
    foreground: { h: 240, s: 10, l: 3.9 },
    primary: { h: 240, s: 5.9, l: 10 },
    accent: { h: 240, s: 4.8, l: 95.9 },
  },
  enableNotifications: true,
  enableSounds: true,
  notePassword: '',
  lastBackupDate: '',
  // Default values for new settings
  enableBiometricAuth: false,
  appLockTimeout: 5, // 5 minutes
  privateBrowsingMode: false,
  textSizeScale: 1, // Normal size
  highContrastMode: false,
  reduceMotion: false,
  notificationCategories: {
    reminders: true,
    updates: true,
    achievements: true,
  },
  doNotDisturbHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
  reminderFrequency: 'daily',
  enableEmailNotifications: false,
};

const defaultDashboardWidgets: DashboardWidgetItem[] = [
  { id: 'todo', hidden: false, size: 'small' },
  { id: 'notes', hidden: false, size: 'small' },
  { id: 'budget', hidden: false, size: 'small' },
  { id: 'history', hidden: false, size: 'small' },
  { id: 'favorites', hidden: false, size: 'small' },
];

const defaultDashboardLayout: DashboardLayoutItem[] = [
  { id: 'stats', hidden: false },
  { id: 'weeklySummary', hidden: false },
  { id: 'quickAccess', hidden: false },
  { id: 'widgets', hidden: false },
  { id: 'whatsNew', hidden: false },
  { id: 'comingSoon', hidden: false },
  { id: 'about', hidden: false },
];

const defaultBudget: Budget = {
  transactions: [],
  accounts: [{ id: 'acc-cash', name: 'Cash', balance: 0 }],
  categories: [
    { id: 'cat-income', name: 'Income', icon: 'Briefcase' },
    { id: 'cat-food', name: 'Food', icon: 'Utensils' },
    { id: 'cat-transport', name: 'Transport', icon: 'Bus' },
    { id: 'cat-shopping', name: 'Shopping', icon: 'ShoppingBag' },
    { id: 'cat-bills', name: 'Bills', icon: 'FileText' },
    { id: 'cat-health', name: 'Health', icon: 'HeartPulse' },
    { id: 'cat-entertainment', name: 'Entertainment', icon: 'Ticket' },
  ],
  goals: [],
};


const getInitialProfile = (): UserProfile => {
  return {
    name: "",
    email: "",
    phone: "",
    address: "",
    birthday: "",
    skills: [],
    socialLinks: {
      linkedin: "",
      twitter: "",
      github: "",
      instagram: "",
    },
    membership: 'guest',
    settings: defaultSettings,
    stats: defaultStats,
    notes: [],
    todos: [],
    activityLog: [],
    quickAccessOrder: [],
    dashboardWidgets: [],
    dashboardLayout: [],
    isAuthenticated: true, // Show dashboard by default
    isGuest: true,
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NTkwNzk5MTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    photoId: 'user-avatar-1',
    history: [],
    favorites: [],
    customUnits: [],
    customCategories: [],
    budget: defaultBudget,
    billReminders: [],
  };
};

const guestProfileDefault: UserProfile = {
  name: "Guest User",
  email: "",
  phone: "91-XXXXXXXXXX",
  address: "New Delhi, India",
  birthday: "January 1, 2000",
  skills: ["Learning", "Exploring"],
  socialLinks: {
    linkedin: "",
    twitter: "",
    github: "",
    instagram: "",
  },
  membership: 'guest',
  settings: defaultSettings,
  stats: defaultStats,
  notes: [],
  todos: [],
  activityLog: [],
  quickAccessOrder: [],
  dashboardWidgets: defaultDashboardWidgets,
  dashboardLayout: defaultDashboardLayout,
  isAuthenticated: true,
  isGuest: true,
  photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NTkwNzk5MTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  photoId: 'user-avatar-1',
  history: [],
  favorites: [],
  customUnits: [],
  customCategories: [],
  budget: defaultBudget,
  billReminders: [],
}

const removeUndefined = (obj: any): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }

  return Object.keys(obj).reduce((acc: any, key) => {
    const val = removeUndefined(obj[key]);
    if (val !== undefined) {
      acc[key] = val;
    }
    return acc;
  }, {});
};

const mergeWithDefaults = (parsedProfile: Partial<UserProfile>): UserProfile => {
  const stats = { ...defaultStats, ...(parsedProfile.stats || {}) };

  const settings: UserSettings = {
    ...defaultSettings,
    ...(parsedProfile.settings || {}),
    customTheme: {
      ...defaultSettings.customTheme!,
      ...(parsedProfile.settings?.customTheme || {})
    } as CustomTheme
  };

  const history = (parsedProfile.history ? (Array.isArray(parsedProfile.history) ? parsedProfile.history : Object.values(parsedProfile.history)) : []) as HistoryItem[];
  const favorites = (parsedProfile.favorites ? (Array.isArray(parsedProfile.favorites) ? parsedProfile.favorites : Object.values(parsedProfile.favorites)) : []) as FavoriteItem[];
  const customUnits = (parsedProfile.customUnits ? (Array.isArray(parsedProfile.customUnits) ? parsedProfile.customUnits : Object.values(parsedProfile.customUnits)) : []) as CustomUnit[];
  const customCategories = (parsedProfile.customCategories ? (Array.isArray(parsedProfile.customCategories) ? parsedProfile.customCategories : Object.values(parsedProfile.customCategories)) : []) as CustomCategory[];

  return {
    ...guestProfileDefault,
    ...parsedProfile,
    settings,
    stats,
    history,
    favorites,
    customUnits,
    customCategories,
    notes: parsedProfile.notes || [],
    todos: parsedProfile.todos || [],
    activityLog: parsedProfile.activityLog || [],
    dashboardWidgets: parsedProfile.dashboardWidgets || defaultDashboardWidgets,
    dashboardLayout: parsedProfile.dashboardLayout || defaultDashboardLayout,
    budget: { ...defaultBudget, ...(parsedProfile.budget || {}) },
    billReminders: parsedProfile.billReminders || [],
  } as UserProfile;
};

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<UserProfile>(getInitialProfile());
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { toast } = useToast();
  const prevMembershipRef = useRef<Membership>();

  useEffect(() => {
    const saved = localStorage.getItem('sutradhaar_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfileState({ ...getInitialProfile(), ...parsed, isAuthenticated: false });
      } catch (e) {
        console.error('Failed to load profile', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for internet connection loss to auto-redirect to offline mode
  useEffect(() => {
    const handleOffline = () => {
      window.location.href = '/offline-app/index.html';
    };

    window.addEventListener('offline', handleOffline);

    // Check on initial load as well
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set up Supabase Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      if (user) {
        setProfileState(prev => ({
          ...prev,
          isAuthenticated: true,
          isGuest: user.is_anonymous || false,
          email: user.email || prev.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || prev.name,
          photoUrl: user.user_metadata?.avatar_url || prev.photoUrl,
          trialClaimedAt: user.user_metadata?.trial_claimed_at || prev.trialClaimedAt,
          membership: user.user_metadata?.membership || prev.membership,
          membershipExpiresAt: user.user_metadata?.membership_expires_at || prev.membershipExpiresAt,
        }));

        // Verify membership is still valid (not revoked by admin)
        if (user.user_metadata?.membership && user.email) {
          supabase.from('membership_codes')
            .select('id')
            .eq('used_by', user.email)
            .limit(1)
            .then(({ data, error }) => {
              if (!error && (!data || data.length === 0)) {
                // Code was revoked or deleted by admin!
                supabase.auth.updateUser({ data: { membership: null, membership_expires_at: null } });
                setProfileState(prev => ({ ...prev, membership: undefined, membershipExpiresAt: undefined }));
              }
            });
        }
        
        // Cloud Sync: Fetch profile from cloud
        if (!user.is_anonymous) {
          supabase.from('user_profiles').select('data').eq('id', user.id).single().then(({ data, error }) => {
            if (data && data.data) {
              setProfileState(prev => mergeWithDefaults({ ...prev, ...data.data }));
            }
          });
        }
        
      } else {
        setProfileState(prev => {
          if (prev.isGuest && prev.isAuthenticated) {
            return prev;
          }
          return {
            ...prev,
            isAuthenticated: false,
            isGuest: false,
          };
        });
      }
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        setProfileState(prev => ({
          ...prev,
          isAuthenticated: true,
          isGuest: user.is_anonymous || false,
          email: user.email || prev.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || prev.name,
          photoUrl: user.user_metadata?.avatar_url || prev.photoUrl,
          trialClaimedAt: user.user_metadata?.trial_claimed_at || prev.trialClaimedAt,
          membership: user.user_metadata?.membership || prev.membership,
          membershipExpiresAt: user.user_metadata?.membership_expires_at || prev.membershipExpiresAt,
        }));

        if (user.user_metadata?.membership && user.email) {
          supabase.from('membership_codes')
            .select('id')
            .eq('used_by', user.email)
            .limit(1)
            .then(({ data, error }) => {
              if (!error && (!data || data.length === 0)) {
                supabase.auth.updateUser({ data: { membership: null, membership_expires_at: null } });
                setProfileState(prev => ({ ...prev, membership: undefined, membershipExpiresAt: undefined }));
              }
            });
        }
        
        if (!user.is_anonymous) {
          supabase.from('user_profiles').select('data').eq('id', user.id).single().then(({ data, error }) => {
            if (data && data.data) {
              setProfileState(prev => mergeWithDefaults({ ...prev, ...data.data }));
            }
          });
        }
      } else {
        setProfileState(prev => {
          if (prev.isGuest && prev.isAuthenticated) {
            return prev;
          }
          return {
            ...prev,
            isAuthenticated: false,
            isGuest: false,
          };
        });
      }
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const savedProfileRaw = localStorage.getItem('sutradhaar_profile');
    if (savedProfileRaw) {
      setProfileState(mergeWithDefaults(JSON.parse(savedProfileRaw)));
    } else {
      setProfileState(guestProfileDefault);
    }
    setIsLoading(false);

  }, []);

  useEffect(() => {
    if (!isLoading && profile.membership !== prevMembershipRef.current) {
      if (profile.membership === 'premium' && prevMembershipRef.current === 'member') {
        toast({
          title: "Congratulations! 💎",
          description: "You've been upgraded to a Premium Member.",
        });
      }
      prevMembershipRef.current = profile.membership;
    }
  }, [profile.membership, isLoading, toast]);

  useEffect(() => {
    if (!isLoading) {
      checkAndUpdateStreak();
    }
  }, [isLoading]);

  const syncToCloud = useDebouncedCallback(async (profileData: UserProfile) => {
    if (profileData.isAuthenticated && !profileData.isGuest) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.is_anonymous) {
        const { error } = await supabase.from('user_profiles').upsert({
            id: user.id,
            data: removeUndefined(profileData),
            updated_at: new Date().toISOString()
        });
        if (error) console.error("Cloud sync error:", error);
      }
    }
  }, 2000);

  const setProfile = (newProfileData: UserProfile | ((prevState: UserProfile) => UserProfile)) => {
    setProfileState(currentProfile => {
      let updatedProfile = typeof newProfileData === 'function' ? newProfileData(currentProfile) : newProfileData;

      localStorage.setItem('sutradhaar_profile', JSON.stringify(updatedProfile));
      syncToCloud(updatedProfile);
      return updatedProfile;
    });
  };

  const markNotificationAsRead = (id: string) => {
    setProfile(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        readNotificationIds: [...(prev.settings.readNotificationIds || []), id]
      }
    }));
  };

  const dismissNotification = (id: string) => {
    setProfile(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        dismissedNotificationIds: [...(prev.settings.dismissedNotificationIds || []), id]
      }
    }));
  };

  const updateStats = (type: ActivityType) => {
    setProfile(prevProfile => {
      const todayISO = new Date().toISOString();
      const newStats = { ...prevProfile.stats };
      const newActivityLog = [...prevProfile.activityLog, { timestamp: todayISO, type }];

      newStats.allTimeActivities = (newStats.allTimeActivities || 0) + 1;

      const lastActivityDate = newStats.lastActivityDate;
      if (lastActivityDate && isToday(new Date(lastActivityDate))) {
        newStats.todayActivities = (newStats.todayActivities || 0) + 1;
      } else {
        newStats.todayActivities = 1;
      }

      newStats.lastActivityDate = todayISO;

      return {
        ...prevProfile,
        stats: newStats,
        activityLog: newActivityLog,
      };
    });
  };

  const addXP = (amount: number, reason: string) => {
    setProfile(prevProfile => {
      const isPremium = prevProfile.membership === 'premium';
      const isStandard = prevProfile.membership === 'standard';
      
      let multiplier = 1;
      if (isPremium) multiplier = 2;
      else if (isStandard) multiplier = 1.5;

      const actualAmount = Math.round(amount * multiplier);

      const newStats = { ...prevProfile.stats };
      newStats.xp = (newStats.xp || 0) + actualAmount;
      
      const newLevel = calculateLevelFromXP(newStats.xp);
      
      if (newLevel > (newStats.level || 1)) {
         setTimeout(() => {
           toast({
             title: `Level Up! 🎉`,
             description: `You reached Level ${newLevel}!`,
           });
         }, 0);
      } else if (!isPremium && !isStandard && amount >= 5) {
         // Show a teaser to free users occasionally
         if (Math.random() > 0.7) {
            setTimeout(() => {
              toast({
                title: `XP Earned! ✨`,
                description: `You got +${amount} XP. Premium users earn +${amount * 2} XP!`,
                action: <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'membership' }))}>Upgrade</Button>
              });
            }, 0);
         }
      }
      
      newStats.level = newLevel;
      return { ...prevProfile, stats: newStats };
    });
  };


  const checkAndUpdateStreak = () => {
    setProfile(prevProfile => {
      const today = startOfDay(new Date());
      const stats = prevProfile.stats || defaultStats;
      const lastOpen = stats.lastAppOpenDate ? startOfDay(new Date(stats.lastAppOpenDate)) : null;

      if (lastOpen && isToday(lastOpen)) {
        return prevProfile;
      }

      const newStats = { ...stats };

      if (lastOpen && isYesterday(lastOpen)) {
        newStats.streak = (newStats.streak || 0) + 1;
      } else if (!lastOpen || !isToday(lastOpen)) {
        newStats.streak = 1;
      }

      if (!lastOpen || !isToday(lastOpen)) {
        newStats.daysActive = (newStats.daysActive || 0) + 1;
      }

      newStats.lastAppOpenDate = today.toISOString();

      return { ...prevProfile, stats: newStats };
    });
  };

  const deleteAllUserData = async () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sutradhaar_')) {
        localStorage.removeItem(key);
      }
    });
    setProfileState(getInitialProfile());
  };

  const addConversionToHistory = (item: Omit<ConversionHistoryItem, 'id' | 'timestamp' | 'type'>) => {
    if (!profile.settings.saveHistory) return;
    const newItem: ConversionHistoryItem = { ...item, id: new Date().getTime().toString(), timestamp: new Date().toISOString(), type: 'conversion' };
    setProfile(p => ({ ...p, history: [newItem, ...p.history] }));
    updateStats('conversion');
  };

  const addCalculatorToHistory = (item: Omit<CalculatorHistoryItem, 'id' | 'timestamp' | 'type'>) => {
    if (!profile.settings.saveHistory) return;
    const newItem: CalculatorHistoryItem = { ...item, id: new Date().getTime().toString(), timestamp: new Date().toISOString(), type: 'calculator' };
    setProfile(p => ({ ...p, history: [newItem, ...p.history] }));
    updateStats('calculator');
  };

  const addDateCalculationToHistory = (item: Omit<DateCalculationHistoryItem, 'id' | 'timestamp' | 'type'>) => {
    if (!profile.settings.saveHistory) return;
    const newItem: DateCalculationHistoryItem = { ...item, id: new Date().getTime().toString(), timestamp: new Date().toISOString(), type: 'date_calculation' };
    setProfile(p => ({ ...p, history: [newItem, ...p.history] }));
    updateStats('date_calculation');
  };

  const addTranslationToHistory = (item: Omit<TranslationHistoryItem, 'id' | 'timestamp' | 'type'>) => {
    if (!profile.settings.saveHistory) return;
    const newItem: TranslationHistoryItem = { ...item, id: new Date().getTime().toString(), timestamp: new Date().toISOString(), type: 'translation' };
    setProfile(p => ({ ...p, history: [newItem, ...p.history] }));
    updateStats('translation');
  };

  const addFavorite = (item: Omit<FavoriteItem, 'id' | 'type'>) => {
    const newItem: FavoriteItem = { ...item, id: new Date().getTime().toString(), type: 'favorite' };
    setProfile(p => ({ ...p, favorites: [newItem, ...p.favorites] }));
  };

  const deleteHistoryItem = (id: string) => {
    setProfile(p => ({ ...p, history: p.history.filter(item => item.id !== id) }));
  };

  const deleteFavorite = (id: string) => {
    setProfile(p => ({ ...p, favorites: p.favorites.filter(item => item.id !== id) }));
  };

  const clearAllHistory = (type: 'conversion' | 'calculator' | 'date_calculation' | 'translation' | 'all') => {
    if (type === 'all') {
      setProfile(p => ({ ...p, history: [] }));
      return;
    }
    setProfile(p => ({ ...p, history: p.history.filter(item => item.type !== type) }));
  };

  const clearAllFavorites = () => {
    setProfile(p => ({ ...p, favorites: [] }));
  };

  const updateDashboardWidgets = (widgets: DashboardWidgetItem[]) => {
    setProfile(p => ({ ...p, dashboardWidgets: widgets }));
  };

  const addCustomUnit = (unit: Omit<CustomUnit, 'id'>) => {
    const newUnit: CustomUnit = { ...unit, id: new Date().getTime().toString() };
    setProfile(p => ({ ...p, customUnits: [...(p.customUnits || []), newUnit] }));
  }

  const updateCustomUnit = (unitToUpdate: CustomUnit) => {
    setProfile(p => ({ ...p, customUnits: (p.customUnits || []).map(u => u.id === unitToUpdate.id ? unitToUpdate : u) }));
  }

  const deleteCustomUnit = (id: string) => {
    setProfile(p => ({ ...p, customUnits: (p.customUnits || []).filter(u => u.id !== id) }));
  }

  const getCustomUnitBySymbol = (symbol: string) => {
    return profile.customUnits?.find(u => u.symbol === symbol);
  };

  const addCustomCategory = (name: string) => {
    const newCategory: CustomCategory = { name, id: new Date().getTime().toString() };
    setProfile(p => ({ ...p, customCategories: [...(p.customCategories || []), newCategory] }));
  }

  const updateCustomCategory = (categoryToUpdate: CustomCategory) => {
    setProfile(p => ({ ...p, customCategories: (p.customCategories || []).map(c => c.id === categoryToUpdate.id ? categoryToUpdate : c) }));
  }

  const deleteCustomCategory = (id: string) => {
    setProfile(p => ({ ...p, customCategories: (p.customCategories || []).filter(c => c.id !== id) }));
  }

  // Budget Functions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newId = `${new Date().getTime()}-${Math.random().toString(36).slice(2, 9)}`;
    const newTransaction: Transaction = { ...transaction, id: newId };

    setProfile(p => {
      const newAccounts = p.budget.accounts.map(acc => {
        if (acc.id === newTransaction.accountId) {
          const newBalance = newTransaction.type === 'income' ? acc.balance + newTransaction.amount : acc.balance - newTransaction.amount;
          return { ...acc, balance: newBalance };
        }
        return acc;
      });
      return {
        ...p,
        budget: {
          ...p.budget,
          accounts: newAccounts,
          transactions: [...p.budget.transactions, newTransaction]
        }
      };
    });
  };

  const updateTransaction = (transactionToUpdate: Transaction) => {
    const oldTransaction = profile.budget.transactions.find(t => t.id === transactionToUpdate.id);
    if (!oldTransaction) return;

    setProfile(p => {
      const newAccounts = p.budget.accounts.map(acc => {
        let balance = acc.balance;
        // Revert old transaction effect
        if (acc.id === oldTransaction.accountId) {
          const oldAmount = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
          balance += oldAmount;
        }
        // Apply new transaction effect
        if (acc.id === transactionToUpdate.accountId) {
          const newAmount = transactionToUpdate.type === 'income' ? transactionToUpdate.amount : -transactionToUpdate.amount;
          balance += newAmount;
        }
        return { ...acc, balance };
      });
      return {
        ...p,
        budget: {
          ...p.budget,
          accounts: newAccounts,
          transactions: p.budget.transactions.map(t => t.id === transactionToUpdate.id ? transactionToUpdate : t)
        }
      };
    });
  };

  const deleteTransaction = (id: string) => {
    const transactionToDelete = profile.budget.transactions.find(t => t.id === id);
    if (!transactionToDelete) return;

    setProfile(p => {
      const newAccounts = p.budget.accounts.map(acc => {
        if (acc.id === transactionToDelete.accountId) {
          const amountChange = transactionToDelete.type === 'income' ? -transactionToDelete.amount : transactionToDelete.amount;
          return { ...acc, balance: acc.balance + amountChange };
        }
        return acc;
      });
      return {
        ...p,
        budget: {
          ...p.budget,
          accounts: newAccounts,
          transactions: p.budget.transactions.filter(t => t.id !== id)
        }
      };
    });
  };

  const transferBetweenAccounts = (fromAccountId: string, toAccountId: string, amount: number) => {
    const timestamp = new Date().getTime();
    const fromTransactionData = {
      type: 'expense' as 'expense',
      amount: amount,
      description: `Transfer to account`,
      categoryId: 'cat-bills', // Placeholder, consider a 'Transfer' category
      accountId: fromAccountId,
      date: new Date(timestamp).toISOString()
    };
    const toTransactionData = {
      type: 'income' as 'income',
      amount: amount,
      description: `Transfer from account`,
      categoryId: 'cat-income',
      accountId: toAccountId,
      date: new Date(timestamp).toISOString()
    };

    addTransaction(fromTransactionData);
    addTransaction(toTransactionData);
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = { ...account, id: new Date().getTime().toString() };
    setProfile(p => ({ ...p, budget: { ...p.budget, accounts: [...p.budget.accounts, newAccount] } }));
  };

  const updateAccount = (accountToUpdate: Account) => {
    setProfile(p => ({ ...p, budget: { ...p.budget, accounts: p.budget.accounts.map(a => a.id === accountToUpdate.id ? accountToUpdate : a) } }));
  };

  const deleteAccount = (id: string) => {
    setProfile(p => ({ ...p, budget: { ...p.budget, accounts: p.budget.accounts.filter(a => a.id !== id) } }));
  }

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = { ...category, id: new Date().getTime().toString() };
    setProfile(p => ({ ...p, budget: { ...p.budget, categories: [...p.budget.categories, newCategory] } }));
  };

  const updateCategory = (categoryToUpdate: Category) => {
    setProfile(p => ({ ...p, budget: { ...p.budget, categories: p.budget.categories.map(c => c.id === categoryToUpdate.id ? categoryToUpdate : c) } }));
  };

  const deleteCategory = (id: string) => {
    setProfile(p => ({ ...p, budget: { ...p.budget, categories: p.budget.categories.filter(c => c.id !== id) } }));
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    const newGoal: SavingsGoal = { ...goal, id: new Date().getTime().toString(), currentAmount: 0 };
    setProfile(p => ({ ...p, budget: { ...p.budget, goals: [...p.budget.goals, newGoal] } }));
  };

  const updateSavingsGoal = (goalToUpdate: SavingsGoal) => {
    setProfile(p => ({ ...p, budget: { ...p.budget, goals: p.budget.goals.map(g => g.id === goalToUpdate.id ? goalToUpdate : g) } }));
  };

  const deleteSavingsGoal = (id: string) => {
    setProfile(p => ({ ...p, budget: { ...p.budget, goals: p.budget.goals.filter(g => g.id !== id) } }));
  };

  const contributeToGoal = (goalId: string, amount: number, accountId: string) => {
    addTransaction({
      type: 'expense',
      amount,
      description: `Contribution to goal`,
      categoryId: 'cat-bills', // Or a dedicated 'Savings' category
      accountId,
      date: new Date().toISOString(),
    });

    setProfile(p => {
      const newGoals = p.budget.goals.map(g => {
        if (g.id === goalId) {
          return { ...g, currentAmount: g.currentAmount + amount };
        }
        return g;
      });
      return { ...p, budget: { ...p.budget, goals: newGoals } };
    });
  };

  const addBillReminder = (reminder: Omit<BillReminder, 'id'>) => {
    const newReminder: BillReminder = { ...reminder, id: new Date().getTime().toString() };
    setProfile(p => ({ ...p, billReminders: [...p.billReminders, newReminder] }));
  };

  const updateBillReminder = (reminder: BillReminder) => {
    setProfile(p => ({ ...p, billReminders: p.billReminders.map(r => r.id === reminder.id ? reminder : r) }));
  };

  const deleteBillReminder = (id: string) => {
    setProfile(p => ({ ...p, billReminders: p.billReminders.filter(r => r.id !== id) }));
  };


  const addNote = (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: NoteItem = {
      ...note,
      id: new Date().getTime().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProfile(p => ({ ...p, notes: [newNote, ...p.notes] }));
    addXP(10, 'Created a note');
  };

  const updateNote = (noteToUpdate: NoteItem) => {
    const updatedNote = { ...noteToUpdate, updatedAt: new Date().toISOString() };
    setProfile(p => ({ ...p, notes: p.notes.map(n => n.id === updatedNote.id ? updatedNote : n) }));
  };

  const deleteNote = (id: string) => {
    setProfile(p => ({ ...p, notes: p.notes.filter(n => n.id !== id) }));
  };

  const addTodo = (todo: Omit<TodoItem, 'id' | 'createdAt'>) => {
    const newTodo: TodoItem = {
      ...todo,
      id: new Date().getTime().toString(),
      createdAt: new Date().toISOString(),
    };
    setProfile(p => ({ ...p, todos: [newTodo, ...p.todos] }));
    addXP(5, 'Created a task');
  };

  const updateTodo = (todoToUpdate: TodoItem) => {
    setProfile(p => {
       const oldTodo = p.todos.find(t => t.id === todoToUpdate.id);
       if (oldTodo && !oldTodo.completed && todoToUpdate.completed) {
          setTimeout(() => addXP(20, 'Completed a task'), 0);
       }
       return { ...p, todos: p.todos.map(t => t.id === todoToUpdate.id ? todoToUpdate : t) };
    });
  };

  const deleteTodo = (id: string) => {
    setProfile(p => ({ ...p, todos: p.todos.filter(t => t.id !== id) }));
  };

  const subscribeToPushNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast({ title: 'Unsupported', description: 'Push notifications are not supported by your browser.' });
        return;
      }
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({ title: 'Permission Denied', description: 'Please allow notifications in your browser settings.' });
        return;
      }
      
      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
          toast({ title: 'Configuration Error', description: 'VAPID public key is not set.' });
          return;
        }

        const urlBase64ToUint8Array = (base64String: string) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };
        
        const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions').insert({
          user_id: user.id,
          subscription: subscription
        });
        toast({ title: 'Notifications Enabled', description: 'You will now receive push notifications!' });
      } else {
        toast({ title: 'Error', description: 'You must be logged in to enable push notifications.' });
      }
      
    } catch (error) {
      console.error('Push subscription failed:', error);
      toast({ title: 'Error', description: 'Failed to enable notifications.' });
    }
  };

  const getCustomCategoryById = (id: string) => {
    return profile.customCategories?.find(c => c.id === id);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('sutradhaar_profile');
      setProfileState(getInitialProfile()); // completely reset state
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      setProfile,
      checkAndUpdateStreak,
      isLoading,
      isAuthLoading,
      isGuest: profile.isGuest || false,
      logout,
      addNote,
      updateNote,
      deleteNote,
      addTodo,
      updateTodo,
      deleteTodo,
      deleteAllUserData,
      markNotificationAsRead,
      dismissNotification,
      updateStats,
      addXP,
      history: profile.history,
      favorites: profile.favorites,
      addConversionToHistory,
      addCalculatorToHistory,
      addDateCalculationToHistory,
      addTranslationToHistory,
      addFavorite,
      deleteHistoryItem,
      deleteFavorite,
      clearAllHistory,
      clearAllFavorites,
      addCustomUnit,
      updateCustomUnit,
      deleteCustomUnit,
      getCustomUnitBySymbol,
      addCustomCategory,
      updateCustomCategory,
      deleteCustomCategory,
      getCustomCategoryById,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      transferBetweenAccounts,
      addAccount,
      updateAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      contributeToGoal,
      addBillReminder,
      updateBillReminder,
      deleteBillReminder,
      subscribeToPushNotifications,
      updateDashboardWidgets,
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};





