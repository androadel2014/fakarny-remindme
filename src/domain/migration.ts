import { latestClosedCycleDate, type Language, type ShoppingItem, type ShoppingList, type Weekday } from './shopping.ts';

type RecordValue = Record<string, unknown>;
function isRecord(value: unknown): value is RecordValue {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
function parseLegacyItems(value: unknown): ShoppingItem[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.map(raw => {
    if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.name !== 'string') return null;
    const name = raw.name.trim();
    if (!name || ids.has(raw.id)) return null;
    ids.add(raw.id);
    const now = new Date().toISOString();
    return {
      id: raw.id,
      name: name.slice(0, 160),
      checked: raw.checked === true,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    };
  }).filter((item): item is ShoppingItem => item !== null);
}

/** Legacy v2 shape is retained so existing v1 migration and tests are untouched. */
export interface LegacyV2State {
  schemaVersion: 2;
  lists: ShoppingList[];
  preferences: { language: Language };
  hasSeenIntro: boolean;
}

/** Pure v1-to-v2 migration; storage then upgrades to v3 without deleting v1/v2. */
export function migrateLegacyState(value: unknown, now = new Date()): LegacyV2State {
  if (!isRecord(value) || value.schemaVersion !== 1) throw new Error('INVALID_SAVED_DATA');
  const prefs = isRecord(value.preferences) ? value.preferences : {};
  const language: Language = prefs.language === 'en' ? 'en' : 'ar';
  const weekday = typeof prefs.weekday === 'number' && Number.isInteger(prefs.weekday) && prefs.weekday >= 1 && prefs.weekday <= 7
    ? prefs.weekday as Weekday : 1;
  const hour = typeof prefs.hour === 'number' && Number.isInteger(prefs.hour) && prefs.hour >= 0 && prefs.hour < 24 ? prefs.hour : 10;
  const minute = typeof prefs.minute === 'number' && Number.isInteger(prefs.minute) && prefs.minute >= 0 && prefs.minute < 60 ? prefs.minute : 0;
  const list: ShoppingList = {
    id: 'migrated-v1-home-list',
    name: language === 'ar' ? 'متجر البيت' : 'Home store',
    items: parseLegacyItems(value.items),
    schedule: { enabled: true, weekdays: [weekday], hour, minute },
    lastHandledShoppingDate: isDateKey(value.lastHandledShoppingDate)
      ? value.lastHandledShoppingDate
      : latestClosedCycleDate(now, [weekday]),
  };
  return { schemaVersion: 2, lists: [list], preferences: { language }, hasSeenIntro: false };
}
