/** Pure saved-state decoder (v2 -> v3 and v3); no device dependencies. */
import { isValidMonthlyDay, latestClosedListCycleDate, type AppState, type Language, type ListSchedule, type ShoppingItem, type ShoppingList, type Weekday } from './shopping.ts';

type RecordValue = Record<string, unknown>;
function isRecord(value: unknown): value is RecordValue { return !!value && typeof value === 'object' && !Array.isArray(value); }
function isDateKey(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value); }

function parseItem(value: unknown): ShoppingItem | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  const name = value.name.trim();
  if (!name) return null;
  const now = new Date().toISOString();
  return { id: value.id, name: name.slice(0, 160), checked: value.checked === true,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now };
}
function parseItems(value: unknown): ShoppingItem[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.map(parseItem).filter((item): item is ShoppingItem => {
    if (!item || ids.has(item.id)) return false;
    ids.add(item.id); return true;
  });
}
function parseWeekdays(value: unknown, fallback: Weekday[] = [1]): Weekday[] {
  if (!Array.isArray(value)) return fallback;
  return [...new Set(value.filter((day): day is Weekday => typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 7))].sort((a, b) => a - b);
}
function parseSchedule(value: unknown, forceWeekly = false): ListSchedule {
  const fallback: ListSchedule = { enabled: true, cadence: 'weekly', weekdays: [1], hour: 10, minute: 0 };
  if (!isRecord(value)) return fallback;
  const hour = typeof value.hour === 'number' && Number.isInteger(value.hour) && value.hour >= 0 && value.hour < 24 ? value.hour : 10;
  const minute = typeof value.minute === 'number' && Number.isInteger(value.minute) && value.minute >= 0 && value.minute < 60 ? value.minute : 0;
  if (!forceWeekly && value.cadence === 'monthly') {
    return {
      enabled: value.enabled !== false,
      cadence: 'monthly',
      weekdays: [],
      dayOfMonth: typeof value.dayOfMonth === 'number' && isValidMonthlyDay(value.dayOfMonth) ? value.dayOfMonth : 1,
      hour, minute,
    };
  }
  return { enabled: value.enabled !== false, cadence: 'weekly', weekdays: parseWeekdays(value.weekdays, fallback.weekdays), hour, minute };
}
function parseList(value: unknown, now: Date, forceWeekly: boolean): ShoppingList | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || !value.name.trim()) return null;
  const schedule = parseSchedule(value.schedule, forceWeekly);
  return { id: value.id, name: value.name.trim().slice(0, 80), items: parseItems(value.items), schedule,
    lastHandledShoppingDate: isDateKey(value.lastHandledShoppingDate) ? value.lastHandledShoppingDate : latestClosedListCycleDate(now, schedule) };
}

/** Parses v3 and upgrades existing v2 lists, which implicitly have weekly cadence. */
export function parseCurrentState(value: unknown, now = new Date()): AppState {
  if (!isRecord(value) || (value.schemaVersion !== 2 && value.schemaVersion !== 3) || !Array.isArray(value.lists)) throw new Error('INVALID_SAVED_DATA');
  const ids = new Set<string>();
  const forceWeekly = value.schemaVersion === 2;
  const lists = value.lists.map(item => parseList(item, now, forceWeekly)).filter((list): list is ShoppingList => {
    if (!list || ids.has(list.id)) return false;
    ids.add(list.id); return true;
  });
  const preferences = isRecord(value.preferences) ? value.preferences : {};
  const language: Language = preferences.language === 'en' ? 'en' : 'ar';
  return { schemaVersion: 3, lists, preferences: { language }, hasSeenIntro: value.hasSeenIntro === true };
}

