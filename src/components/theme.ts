import { Platform, StyleSheet } from 'react-native';
import type { Language } from '../domain/shopping';

export type ThemeMode = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

const LIGHT = {
  page: '#FCFAF4', paper: '#FFFFFF', forest: '#245D48', forestDeep: '#153C2E',
  mint: '#E3EFE6', text: '#25382E', muted: '#738074', border: '#E8E7DC',
  apricot: '#F4B67C', peach: '#FFF1DF', coral: '#D75D4E', soft: '#F2F4EC',
  highlight: '#F7D99A', overlay: 'rgba(18,38,27,0.58)', dangerBg: '#FCEAE5',
  dangerBorder: '#F2C9BF', checkBorder: '#B8C3B6', onForestMuted: '#D7E8DC',
  onForestTrack: 'rgba(255,255,255,0.2)', placeholder: '#9A9E94',
};

type ThemeColors = { [K in keyof typeof LIGHT]: string };
const DARK: ThemeColors = {
  page: '#101713', paper: '#1A241E', forest: '#397B5A', forestDeep: '#E4F1E7',
  mint: '#263F31', text: '#E7EEE9', muted: '#A0AEA4', border: '#34433A',
  apricot: '#B77C43', peach: '#382D22', coral: '#F28A7A', soft: '#253129',
  highlight: '#65512E', overlay: 'rgba(0,0,0,0.76)', dangerBg: '#432B28',
  dangerBorder: '#70413A', checkBorder: '#718077', onForestMuted: '#D7E8DC',
  onForestTrack: 'rgba(255,255,255,0.2)', placeholder: '#87958C',
};

let activeTheme: ResolvedTheme = 'light';
let activeColors: ThemeColors = LIGHT;
let cachedStyles: ReturnType<typeof createStyles> | null = null;

export function setActiveTheme(theme: ResolvedTheme): void {
  if (activeTheme === theme) return;
  activeTheme = theme;
  activeColors = theme === 'dark' ? DARK : LIGHT;
  cachedStyles = null;
}

export function getActiveTheme(): ResolvedTheme { return activeTheme; }

// A palette proxy keeps the existing screen components theme-aware without
// duplicating the design tokens across every screen.
export const C = new Proxy({} as ThemeColors, {
  get: (_target, property) => activeColors[property as keyof ThemeColors],
});

function createStyles() {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.page },
    card: { backgroundColor: C.paper, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 18 },
    shadow: Platform.select({
      ios: { shadowColor: activeTheme === 'dark' ? '#000000' : '#24462F', shadowOpacity: activeTheme === 'dark' ? 0.28 : 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      default: { elevation: 2,
        ...(activeTheme === 'dark' ? { shadowColor: '#000000' } : {}) },
    }),
    heading: { color: C.forestDeep, fontSize: 27, fontWeight: '800' },
    subhead: { color: C.forestDeep, fontSize: 20, fontWeight: '800' },
    body: { color: C.text, fontSize: 16 },
    muted: { color: C.muted, fontSize: 14, lineHeight: 21 },
    button: { backgroundColor: C.forest, borderRadius: 18, minHeight: 54, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    pill: { borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14, minHeight: 44 },
    input: { borderColor: C.border, borderWidth: 1.5, borderRadius: 16, backgroundColor: C.page, color: C.forestDeep, minHeight: 58, paddingHorizontal: 16, fontSize: 17, fontWeight: '600' },
  });
}

export const S = new Proxy({} as ReturnType<typeof createStyles>, {
  get: (_target, property) => {
    cachedStyles ??= createStyles();
    return cachedStyles[property as keyof ReturnType<typeof createStyles>];
  },
});

export function dirStyle(lang: Language): { textAlign: 'right' | 'left'; writingDirection: 'rtl' | 'ltr' } {
  return { textAlign: lang === 'ar' ? 'right' : 'left', writingDirection: lang === 'ar' ? 'rtl' : 'ltr' };
}

/** Follow the actual script for user-entered names, not only the UI language. */
export function textDirStyle(value: string, fallback: Language): { textAlign: 'right' | 'left'; writingDirection: 'rtl' | 'ltr' } {
  const firstStrong = value.match(/[\u0600-\u06FF]|[A-Za-z]/)?.[0];
  const rtl = firstStrong ? /[\u0600-\u06FF]/.test(firstStrong) : fallback === 'ar';
  return { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' };
}

export function rowDirection(lang: Language): 'row-reverse' | 'row' {
  return lang === 'ar' ? 'row-reverse' : 'row';
}
