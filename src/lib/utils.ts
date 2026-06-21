
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIndianNumber(num: number): string {
  if (num === null || num === undefined) {
    return '0';
  }
  const x = num.toString();
  let afterPoint = '';
  if (x.indexOf('.') > 0) {
    afterPoint = x.substring(x.indexOf('.'), x.length);
  }
  let lastThree = x.substring(x.length - 3);
  const otherNumbers = x.substring(0, x.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return res.split('.')[0] + afterPoint;
}

// App lock timeout functionality
let appLockTimer: NodeJS.Timeout | null = null;

export function setupAppLockTimeout(timeoutMinutes: number, onLock: () => void) {
  if (appLockTimer) {
    clearTimeout(appLockTimer);
  }
  
  if (timeoutMinutes > 0) {
    appLockTimer = setTimeout(() => {
      onLock();
    }, timeoutMinutes * 60 * 1000); // Convert minutes to milliseconds
  }
}

export function resetAppLockTimer(timeoutMinutes: number, onLock: () => void) {
  if (appLockTimer) {
    clearTimeout(appLockTimer);
  }
  
  if (timeoutMinutes > 0) {
    appLockTimer = setTimeout(() => {
      onLock();
    }, timeoutMinutes * 60 * 1000);
  }
}

export function clearAppLockTimer() {
  if (appLockTimer) {
    clearTimeout(appLockTimer);
    appLockTimer = null;
  }
}
