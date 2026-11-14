import { Platform, StyleSheet } from 'react-native';
import type { Language } from '../domain/shopping';

export const C = {
  page: '#FCFAF4', paper: '#FFFFFF', forest: '#245D48', forestDeep: '#153C2E',
  mint: '#E3EFE6', text: '#25382E', muted: '#738074', border: '#E8E7DC',
  apricot: '#F4B67C', peach: '#FFF1DF', coral: '#D75D4E', soft: '#F2F4EC',
  highlight: '#F7D99A', overlay: 'rgba(18,38,27,0.58)',
};

export const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.page },
  card: { backgroundColor: C.paper, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 18 },
  shadow: Platform.select({
    ios: { shadowColor: '#24462F', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
    default: { elevation: 2 },
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

export function dirStyle(lang: Language): { textAlign: 'right' | 'left'; writingDirection: 'rtl' | 'ltr' } {
  return { textAlign: lang === 'ar' ? 'right' : 'left', writingDirection: lang === 'ar' ? 'rtl' : 'ltr' };
}

export function rowDirection(lang: Language): 'row-reverse' | 'row' {
  return lang === 'ar' ? 'row-reverse' : 'row';
}
