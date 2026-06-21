import { UserProfile } from '@/context/ProfileContext';

export const XP_PER_LEVEL = 100;

export type FeatureId = 
  | 'calculator'         // Level 0 (Guest)
  | 'notes'              // Level 1
  | 'settings'           // Level 1
  | 'converter'          // Level 2
  | 'advanced_converter' // Level 10 (Advanced categories)
  | 'themes'             // Level 3
  | 'date_calc'          // Level 3
  | 'timer'              // Level 4
  | 'analytics'          // Level 5
  | 'password_gen'       // Level 6
  | 'budget'             // Level 7
  | 'translator'         // Level 7
  | 'loan_calc'          // Level 8
  | 'backup'             // Level 8
  | 'discount_calc'      // Level 9
  | 'save_history'       // Level 9
  | 'export_pdf';        // Level 10

export const LEVEL_REQUIREMENTS: Record<FeatureId, number> = {
  calculator: 0,
  notes: 1,
  settings: 1,
  
  converter: 2,
  
  themes: 3,
  date_calc: 3,
  
  timer: 4,
  
  analytics: 5,
  
  password_gen: 6,
  
  budget: 7,
  translator: 7,
  
  loan_calc: 8,
  backup: 8,
  
  discount_calc: 9,
  save_history: 9,
  
  advanced_converter: 10,
  export_pdf: 10,
};

/**
 * Check if the user has unlocked a specific feature based on their level.
 * The Admin email automatically bypasses all level locks.
 */
export function hasUnlockedFeature(profile: UserProfile, feature: FeatureId): boolean {
  // Admin override
  if (profile.email === 'amanyadavyadav9458@gmail.com') {
    return true;
  }

  // Premium membership override gets all features immediately
  if (profile.membership === 'premium') {
    return true;
  }

  // Standard membership override gets basic tools, but advanced tools require leveling or Premium
  if (profile.membership === 'standard') {
    const premiumOnlyFeatures: FeatureId[] = [
      'budget', 'loan_calc', 'discount_calc', 'advanced_converter', 'export_pdf'
    ];
    if (!premiumOnlyFeatures.includes(feature)) {
      return true;
    }
    // If it's a premium feature, let it fall through to check if they naturally reached the required Level
  }

  // Check 24-hour free trial override
  if (profile.trialClaimedAt) {
    const trialStart = new Date(profile.trialClaimedAt).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (now - trialStart < twentyFourHours) {
      return true; // Trial is active!
    }
  }

  // Guest users have no advanced features unlocked (only Calculator)
  if (profile.isGuest) {
    if (feature === 'calculator') return true;
    return false;
  }

  const requiredLevel = LEVEL_REQUIREMENTS[feature];
  const userLevel = profile.stats?.level || 1;

  return userLevel >= requiredLevel;
}

export function getXPForNextLevel(currentLevel: number): number {
  return currentLevel * XP_PER_LEVEL;
}

export function calculateLevelFromXP(totalXP: number): number {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1;
}

export function getProgressToNextLevel(totalXP: number): { currentLevelXP: number, nextLevelXP: number, percentage: number } {
  const currentLevel = calculateLevelFromXP(totalXP);
  const currentLevelXP = totalXP % XP_PER_LEVEL;
  const nextLevelXP = XP_PER_LEVEL;
  const percentage = (currentLevelXP / nextLevelXP) * 100;

  return {
    currentLevelXP,
    nextLevelXP,
    percentage
  };
}
