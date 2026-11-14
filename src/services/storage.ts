import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createInitialState,
  latestClosedShoppingDay,
  type Language,
  type Preferences,
  type ShoppingItem,
  type ShoppingState,
  type Weekday,
} from '../domain/shopping';

const STORAGE_KEY = '@fakarny/shopping-state/v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parsePreferences(value: unknown): Preferences {
  const fallback = createInitialState().preferences;
  if (!isRecord(value)) return fallback;
  const weekday: Weekday = typeof value.weekday === 'number' && Number.isInteger(value.weekday) && value.weekday >= 1 && value.weekday <= 7
    ? Number(value.weekday) as Weekday : fallback.weekday;
  const hour = typeof value.hour === 'number' && Number.isInteger(value.hour) && value.hour >= 0 && value.hour < 24
    ? Number(value.hour) : fallback.hour;
  const minute = typeof value.minute === 'number' && Number.isInteger(value.minute) && value.minute >= 0 && value.minute < 60
    ? Number(value.minute) : fallback.minute;
  const language: Language = value.language === 'en' ? 'en' : 'ar';
  return { weekday, hour, minute, language };
}

function parseItem(value: unknown): ShoppingItem | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  const name = value.name.trim();
  if (name.length === 0) return null;
  const now = new Date().toISOString();
  return {
    id: value.id,
    name: name.slice(0, 160),
    checked: value.checked === true,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  };
}

export async function loadState(now = new Date()): Promise<ShoppingState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState(now);
  let value: unknown;
  try { value = JSON.parse(raw) as unknown; } catch { throw new Error('INVALID_SAVED_DATA'); }
  if (!isRecord(value) || value.schemaVersion !== 1) throw new Error('INVALID_SAVED_DATA');
  const preferences = parsePreferences(value.preferences);
  const items = Array.isArray(value.items)
    ? value.items.map(parseItem).filter((item): item is ShoppingItem => !!item)
    : [];
  const ids = new Set<string>();
  const uniqueItems = items.filter(item => {
    if (ids.has(item.id)) return false;
    ids.add(item.id);
    return true;
  });
  return {
    schemaVersion: 1,
    items: uniqueItems,
    preferences,
    lastHandledShoppingDate: typeof value.lastHandledShoppingDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.lastHandledShoppingDate)
      ? value.lastHandledShoppingDate : latestClosedShoppingDay(now, preferences.weekday),
  };
}

export async function saveState(state: ShoppingState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
