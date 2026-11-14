/** All calendar arithmetic uses the device's local civil date/time. */
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

export interface ListSchedule {
  enabled: boolean;
  weekdays: Weekday[];
  hour: number;
  minute: number;
}

export interface ShoppingList {
  id: string;
  name: string; // The store/place this list belongs to.
  items: ShoppingItem[];
  schedule: ListSchedule;
  /** Last completed weekly cycle boundary, in local YYYY-MM-DD form. */
  lastHandledShoppingDate: string;
}

export interface AppPreferences {
  language: Language;
}

export interface AppState {
  schemaVersion: 2;
  lists: ShoppingList[];
  preferences: AppPreferences;
  hasSeenIntro: boolean;
}

export interface ReminderScheduleEntry {
  listId: string;
  listName: string;
  weekday: Weekday;
  hour: number;
  minute: number;
}

export const DEFAULT_LIST_SCHEDULE: ListSchedule = {
  enabled: true,
  weekdays: [1],
  hour: 10,
  minute: 0,
};

export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function validWeekdays(days: readonly number[]): Weekday[] {
  return [...new Set(days.filter((day): day is Weekday => Number.isInteger(day) && day >= 1 && day <= 7))]
    .sort((a, b) => a - b);
}

/** The weekly cycle closes after the final selected weekday has ended. */
export function latestClosedCycleDate(now: Date, weekdays: readonly Weekday[]): string {
  const days = validWeekdays(weekdays);
  const finalDay = days.at(-1) ?? 1;
  const targetJsDay = finalDay - 1;
  const elapsed = (now.getDay() - targetJsDay + 7) % 7;
  // If today is the final reminder day, that cycle remains open until midnight.
  const daysBack = elapsed === 0 ? 7 : elapsed;
  return localDayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack));
}

export function createInitialAppState(): AppState {
  return {
    schemaVersion: 2,
    lists: [],
    preferences: { language: 'ar' },
    hasSeenIntro: false,
  };
}

export function createShoppingList(
  name: string,
  items: ShoppingItem[] = [],
  schedule: ListSchedule = DEFAULT_LIST_SCHEDULE,
  now = new Date(),
  id = `list-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
): ShoppingList {
  const cleanSchedule: ListSchedule = {
    enabled: schedule.enabled,
    weekdays: validWeekdays(schedule.weekdays),
    hour: schedule.hour,
    minute: schedule.minute,
  };
  return {
    id,
    name: name.trim(),
    items: items.map(item => ({ ...item })),
    schedule: cleanSchedule,
    lastHandledShoppingDate: latestClosedCycleDate(now, cleanSchedule.weekdays),
  };
}

/** Checked items clear; unchecked items keep their identity and order. */
export function carryOverUnchecked(items: readonly ShoppingItem[]): ShoppingItem[] {
  return items.filter(item => !item.checked).map(item => ({ ...item, checked: false }));
}

export function applyAutomaticCarryOverToList(list: ShoppingList, now = new Date()): ShoppingList {
  // Reminder on/off controls notifications only; weekly list rollover continues
  // on the selected cycle days even while alerts are muted.
  if (list.schedule.weekdays.length === 0) return list;
  const closedDate = latestClosedCycleDate(now, list.schedule.weekdays);
  if (closedDate <= list.lastHandledShoppingDate) return list;
  return {
    ...list,
    items: carryOverUnchecked(list.items),
    lastHandledShoppingDate: closedDate,
  };
}

export function applyAutomaticCarryOverToLists(state: AppState, now = new Date()): AppState {
  let changed = false;
  const lists = state.lists.map(list => {
    const next = applyAutomaticCarryOverToList(list, now);
    if (next !== list) changed = true;
    return next;
  });
  return changed ? { ...state, lists } : state;
}

/** Manual trip completion clears purchased items immediately. */
export function finishShoppingList(state: AppState, listId: string, now = new Date()): AppState {
  const index = state.lists.findIndex(list => list.id === listId);
  if (index < 0) return state;
  const list = state.lists[index];
  if (!list) return state;
  const days = validWeekdays(list.schedule.weekdays);
  const todayIsCycleEnd = days.length > 0 && now.getDay() + 1 === days[days.length - 1];
  const todayKey = localDayKey(now);
  const finished: ShoppingList = {
    ...list,
    items: carryOverUnchecked(list.items),
    lastHandledShoppingDate: todayIsCycleEnd && todayKey > list.lastHandledShoppingDate
      ? todayKey
      : list.lastHandledShoppingDate,
  };
  const lists = [...state.lists];
  lists[index] = finished;
  return { ...state, lists };
}

export function updateListSchedule(list: ShoppingList, schedule: ListSchedule, now = new Date()): ShoppingList {
  const clean: ListSchedule = {
    enabled: schedule.enabled,
    weekdays: validWeekdays(schedule.weekdays),
    hour: schedule.hour,
    minute: schedule.minute,
  };
  // Only changing the cycle weekdays changes the rollover boundary. Turning
  // alerts off or changing their clock time must not skip a pending cycle.
  const scheduleChanged = list.schedule.weekdays.join(',') !== clean.weekdays.join(',');
  return {
    ...list,
    schedule: clean,
    lastHandledShoppingDate: scheduleChanged
      ? latestClosedCycleDate(now, clean.weekdays)
      : list.lastHandledShoppingDate,
  };
}

export function nextReminderAt(schedule: ListSchedule, now: Date): Date | null {
  if (!schedule.enabled || schedule.weekdays.length === 0) return null;
  const candidates = schedule.weekdays.map(day => {
    const daysAhead = (day - 1 - now.getDay() + 7) % 7;
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, schedule.hour, schedule.minute, 0, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 7);
    return next;
  });
  return candidates.sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
}

export function buildReminderSchedulePlan(lists: readonly ShoppingList[]): ReminderScheduleEntry[] {
  const plan: ReminderScheduleEntry[] = [];
  for (const list of lists) {
    if (!list.schedule.enabled) continue;
    for (const weekday of validWeekdays(list.schedule.weekdays)) {
      plan.push({
        listId: list.id,
        listName: list.name,
        weekday,
        hour: list.schedule.hour,
        minute: list.schedule.minute,
      });
    }
  }
  return plan;
}

export function makeItem(name: string, now = new Date()): ShoppingItem {
  const date = now.toISOString();
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`,
    name: name.trim(),
    checked: false,
    createdAt: date,
    updatedAt: date,
  };
}

// ---------------------------------------------------------------------------
// v1 compatibility helpers. Kept unchanged so the original unit tests and
// existing v1 domain consumers remain valid while storage migrates to schema 2.
// ---------------------------------------------------------------------------
export interface Preferences {
  weekday: Weekday;
  hour: number;
  minute: number;
  language: Language;
}

export interface ShoppingState {
  schemaVersion: 1;
  items: ShoppingItem[];
  preferences: Preferences;
  lastHandledShoppingDate: string;
}

export const DEFAULT_PREFERENCES: Preferences = {
  weekday: 1,
  hour: 10,
  minute: 0,
  language: 'ar',
};

export function latestClosedShoppingDay(now: Date, weekday: Weekday): string {
  return latestClosedCycleDate(now, [weekday]);
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

export function applyAutomaticCarryOver(state: ShoppingState, now = new Date()): ShoppingState {
  const closedDay = latestClosedShoppingDay(now, state.preferences.weekday);
  if (closedDay <= state.lastHandledShoppingDate) return state;
  return {
    ...state,
    items: carryOverUnchecked(state.items),
    lastHandledShoppingDate: closedDay,
  };
}

export function updatePreferences(state: ShoppingState, preferences: Preferences, now = new Date()): ShoppingState {
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
