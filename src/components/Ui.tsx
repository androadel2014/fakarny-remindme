import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Language } from '../domain/shopping';
import { C, S, dirStyle, rowDirection } from './theme';

export function PrimaryButton({ label, onPress, light = false, disabled = false, style }:
  { label: string; onPress: () => void; light?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [S.button, light && { backgroundColor: C.mint }, pressed && { opacity: .83 }, disabled && { opacity: .45 }, style]}>
      <Text style={[S.buttonText, light && { color: C.forest }]}>{label}</Text>
    </Pressable>
  );
}

export function PageHeader({ title, lang, onBack, action, onAction }:
  { title: string; lang: Language; onBack?: () => void; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: rowDirection(lang), alignItems: 'center', justifyContent: 'space-between', minHeight: 58, marginBottom: 18 }}>
      <View style={{ flexDirection: rowDirection(lang), alignItems: 'center', flex: 1, gap: 10 }}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel={lang === 'ar' ? 'رجوع' : 'Back'}
            style={{ backgroundColor: C.paper, borderColor: C.border, borderWidth: 1, width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 25, fontWeight: '700', color: C.forest }}>{lang === 'ar' ? '→' : '←'}</Text>
          </Pressable>
        )}
        <Text numberOfLines={1} style={[S.heading, { flexShrink: 1 }, dirStyle(lang)]}>{title}</Text>
      </View>
      {action && onAction && (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={action} hitSlop={8}
          style={{ backgroundColor: C.mint, borderRadius: 14, minWidth: 48, minHeight: 46, paddingHorizontal: 12, justifyContent: 'center' }}>
          <Text style={{ color: C.forest, fontSize: 14, fontWeight: '800' }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function SectionLabel({ children, lang }: { children: string; lang: Language }) {
  return <Text style={[{ fontSize: 15, fontWeight: '800', color: C.forestDeep, marginBottom: 10 }, dirStyle(lang)]}>{children}</Text>;
}
