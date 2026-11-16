import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInitialAppState, type AppState } from '../domain/shopping';
import { parseCurrentState } from '../domain/stateCodec';
import { migrateLegacyState } from '../domain/migration';
export { migrateLegacyState } from '../domain/migration';
export { parseCurrentState } from '../domain/stateCodec';

export const STORAGE_KEY_V3 = '@fakarny/shopping-state/v3';
export const STORAGE_KEY_V2 = '@fakarny/shopping-state/v2';
export const LEGACY_STORAGE_KEY_V1 = '@fakarny/shopping-state/v1';

function parseSavedJson(raw: string): unknown {
  try { return JSON.parse(raw) as unknown; } catch { throw new Error('INVALID_SAVED_DATA'); }
}

export async function loadState(now = new Date()): Promise<AppState> {
  const currentRaw = await AsyncStorage.getItem(STORAGE_KEY_V3);
  if (currentRaw) return parseCurrentState(parseSavedJson(currentRaw), now);

  // Upgrade the published v1.1.9 schema-2 storage in place, without removing it.
  const v2Raw = await AsyncStorage.getItem(STORAGE_KEY_V2);
  if (v2Raw) {
    const state = parseCurrentState(parseSavedJson(v2Raw), now);
    await AsyncStorage.setItem(STORAGE_KEY_V3, JSON.stringify(state));
    return state;
  }

  const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY_V1);
  if (!legacyRaw) return createInitialAppState();
  const v2State = migrateLegacyState(parseSavedJson(legacyRaw), now);
  const state = parseCurrentState(v2State, now);
  // Keep previous versions as recoverable copies; never replace unreadable data.
  await AsyncStorage.setItem(STORAGE_KEY_V3, JSON.stringify(state));
  return state;
}

export async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_V3, JSON.stringify(state));
}
