import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInitialAppState, latestClosedCycleDate, type AppState, type Language, type ListSchedule, type ShoppingItem, type ShoppingList, type Weekday } from '../domain/shopping';
import { migrateLegacyState } from '../domain/migration';
export { migrateLegacyState } from '../domain/migration';

export const STORAGE_KEY_V2 = '@fakarny/shopping-state/v2';
export const LEGACY_STORAGE_KEY_V1 = '@fakarny/shopping-state/v1';
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
function parseSchedule(value: unknown): ListSchedule {
  const fallback: ListSchedule = { enabled: true, weekdays: [1], hour: 10, minute: 0 };
  if (!isRecord(value)) return fallback;
  const hour = typeof value.hour === 'number' && Number.isInteger(value.hour) && value.hour >= 0 && value.hour < 24 ? value.hour : 10;
  const minute = typeof value.minute === 'number' && Number.isInteger(value.minute) && value.minute >= 0 && value.minute < 60 ? value.minute : 0;
  return { enabled: value.enabled !== false, weekdays: parseWeekdays(value.weekdays, fallback.weekdays), hour, minute };
}
function parseList(value: unknown, now: Date): ShoppingList | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || !value.name.trim()) return null;
  const schedule = parseSchedule(value.schedule);
  return { id: value.id, name: value.name.trim().slice(0, 80), items: parseItems(value.items), schedule,
    lastHandledShoppingDate: isDateKey(value.lastHandledShoppingDate) ? value.lastHandledShoppingDate : latestClosedCycleDate(now, schedule.weekdays) };
}

export function parseCurrentState(value: unknown, now = new Date()): AppState {
  if (!isRecord(value) || value.schemaVersion !== 2 || !Array.isArray(value.lists)) throw new Error('INVALID_SAVED_DATA');
  const ids = new Set<string>();
  const lists = value.lists.map(item => parseList(item, now)).filter((list): list is ShoppingList => {
    if (!list || ids.has(list.id)) return false;
    ids.add(list.id); return true;
  });
  const preferences = isRecord(value.preferences) ? value.preferences : {};
  const language: Language = preferences.language === 'en' ? 'en' : 'ar';
  return { schemaVersion: 2, lists, preferences: { language }, hasSeenIntro: value.hasSeenIntro === true };
}

export async function loadState(now = new Date()): Promise<AppState> {
  const currentRaw = await AsyncStorage.getItem(STORAGE_KEY_V2);
  if (currentRaw) {
    let parsed: unknown;
    try { parsed = JSON.parse(currentRaw) as unknown; } catch { throw new Error('INVALID_SAVED_DATA'); }
    return parseCurrentState(parsed, now);
  }
  const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY_V1);
  if (!legacyRaw) return createInitialAppState();
  let legacy: unknown;
  try { legacy = JSON.parse(legacyRaw) as unknown; } catch { throw new Error('INVALID_SAVED_DATA'); }
  const migrated = migrateLegacyState(legacy, now);
  // Persist the v2 state first; keep the old key as a recoverable safety copy.
  await AsyncStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
  return migrated;
}

export async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
}
