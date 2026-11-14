import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Language } from '../domain/shopping';
import { t } from '../i18n/strings';
import { C, S, dirStyle, rowDirection } from './theme';

export function PrimaryButton({ label, onPress, light = false, disabled = false, style }:
  { label: string; onPress: () => void; light?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [S.button, light && { backgroundColor: C.mint }, pressed && { opacity: .82 }, disabled && { opacity: .42 }, style]}>
      <Text style={[S.buttonText, light && { color: C.forest }]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, danger = false, disabled = false, style }:
  { label: string; onPress: () => void; danger?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [{ minHeight: 48, paddingHorizontal: 15, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: danger ? '#FCEAE5' : C.soft, borderWidth: 1, borderColor: danger ? '#F2C9BF' : C.border }, pressed && { opacity: .8 }, disabled && { opacity: .45 }, style]}>
      <Text style={{ color: danger ? C.coral : C.forest, fontSize: 14, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

export function PageHeader({ title, lang, onBack, action, onAction }:
  { title: string; lang: Language; onBack?: () => void; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: rowDirection(lang), alignItems: 'center', justifyContent: 'space-between', minHeight: 58, marginBottom: 18, gap: 10 }}>
      <View style={{ flexDirection: rowDirection(lang), alignItems: 'center', flex: 1, gap: 10 }}>
        {onBack && <SecondaryButton label={t(lang, 'back')} onPress={onBack} style={{ minWidth: 66 }} />}
        <Text numberOfLines={2} style={[S.heading, { flexShrink: 1 }, dirStyle(lang)]}>{title}</Text>
      </View>
      {action && onAction && <SecondaryButton label={action} onPress={onAction} style={{ minWidth: 76 }} />}
    </View>
  );
}

export function SectionLabel({ children, lang }: { children: string; lang: Language }) {
  return <Text style={[{ fontSize: 15, fontWeight: '800', color: C.forestDeep, marginBottom: 10 }, dirStyle(lang)]}>{children}</Text>;
}

export function ProgressBar({ checked, total, rtl = false }: { checked: number; total: number; rtl?: boolean }) {
  const progress = total > 0 ? Math.max(0, Math.min(1, checked / total)) : 0;
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: checked }} style={{ height: 8, backgroundColor: C.soft, borderRadius: 99, overflow: 'hidden', flexDirection: rtl ? 'row-reverse' : 'row' }}>
      <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: C.forest, borderRadius: 99 }} />
    </View>
  );
}
