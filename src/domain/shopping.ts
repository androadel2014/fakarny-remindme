/** All day arithmetic uses the device's local civil date/time, not UTC. */
export type Language = 'ar' | 'en';
export type RecognitionLanguage = 'ar-EG' | 'en-US';
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // Expo: 1=Sunday

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Preferences {
  weekday: Weekday;
  hour: number; // 0–23
  minute: number; // 0–59
  language: Language;
}

export interface ShoppingState {
  schemaVersion: 1;
  items: ShoppingItem[];
  preferences: Preferences;
  // Local YYYY-MM-DD of the last shopping day whose automatic roll-over is done.
  lastHandledShoppingDate: string;
}

export const DEFAULT_PREFERENCES: Preferences = {
  weekday: 1,
  hour: 10,
  minute: 0,
  language: 'ar',
};

export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function latestClosedShoppingDay(now: Date, weekday: Weekday): string {
  // Today's shopping day is NOT closed until the following midnight.
  const targetJsDay = weekday - 1;
  const elapsed = (now.getDay() - targetJsDay + 7) % 7;
  const daysBack = elapsed === 0 ? 7 : elapsed;
  const previous = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack);
  return localDayKey(previous);
}

export function createInitialState(now = new Date()): ShoppingState {
  return {
    schemaVersion: 1,
    items: [],
    preferences: { ...DEFAULT_PREFERENCES },
    lastHandledShoppingDate: latestClosedShoppingDay(now, DEFAULT_PREFERENCES.weekday),
  };
}

export function nextShoppingAt(now: Date, prefs: Preferences): Date {
  const daysAhead = (prefs.weekday - 1 - now.getDay() + 7) % 7;
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, prefs.hour, prefs.minute);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 7);
  return next;
}

/** Checked products disappear; every unchecked product survives unchanged. */
export function carryOverUnchecked(items: readonly ShoppingItem[]): ShoppingItem[] {
  return items.filter(item => !item.checked).map(item => ({ ...item, checked: false }));
}

/** The manual Finish Shopping action runs exactly the same pure carry-over. */
export function finishShopping(state: ShoppingState, now = new Date()): ShoppingState {
  const shoppingToday = now.getDay() === state.preferences.weekday - 1;
  const currentKey = localDayKey(now);
  return {
    ...state,
    items: carryOverUnchecked(state.items),
    lastHandledShoppingDate: shoppingToday && currentKey > state.lastHandledShoppingDate
      ? currentKey
      : state.lastHandledShoppingDate,
  };
}

/**
 * Reconciles a shopping day after local midnight. Call on start, foreground,
 * and the minute tick. JavaScript cannot run reliably while Android kills an app;
 * reconciliation is intentionally idempotent and catches up on next activation.
 */
export function applyAutomaticCarryOver(state: ShoppingState, now = new Date()): ShoppingState {
  const closedDay = latestClosedShoppingDay(now, state.preferences.weekday);
  if (closedDay <= state.lastHandledShoppingDate) return state;
  return {
    ...state,
    items: carryOverUnchecked(state.items),
    lastHandledShoppingDate: closedDay,
  };
}

export function updatePreferences(
  state: ShoppingState,
  preferences: Preferences,
  now = new Date(),
): ShoppingState {
  return {
    ...state,
    preferences,
    lastHandledShoppingDate: preferences.weekday === state.preferences.weekday
      ? state.lastHandledShoppingDate
      : latestClosedShoppingDay(now, preferences.weekday),
  };
}

export function remainingNames(items: readonly ShoppingItem[]): string[] {
  return items.filter(item => !item.checked).map(item => item.name);
}

export function countdownParts(now: Date, target: Date): { days: number; hours: number; minutes: number } {
  const remaining = Math.max(0, target.getTime() - now.getTime());
  const totalMinutes = Math.ceil(remaining / 60000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}
