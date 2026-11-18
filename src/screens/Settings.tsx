import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import type { Language, ThemeMode } from '../domain/shopping';
import { t } from '../i18n/strings';
import { C, S, dirStyle, rowDirection } from '../components/theme';
import { PageHeader, PrimaryButton, SectionLabel } from '../components/Ui';

interface Props {
  language: Language;
  themeMode: ThemeMode;
  notificationAllowed: boolean;
  onClose: () => void;
  onSave: (language: Language, themeMode: ThemeMode) => void;
  onNotificationPermission: () => void;
  onExactPermission: () => void;
}

export default function Settings({ language, themeMode, notificationAllowed, onClose, onSave, onNotificationPermission, onExactPermission }: Props) {
  const [draft, setDraft] = useState<Language>(language);
  const [draftTheme, setDraftTheme] = useState<ThemeMode>(themeMode);
  useEffect(() => setDraft(language), [language]);
  useEffect(() => setDraftTheme(themeMode), [themeMode]);

  return (
    <View style={S.screen}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 }}>
        <PageHeader title={t(draft, 'settingsTitle')} lang={draft} onBack={onClose} />
        <View style={[S.card, S.shadow, { marginBottom: 16 }]}>
          <SectionLabel lang={draft}>{t(draft, 'language')}</SectionLabel>
          <View style={{ flexDirection: rowDirection(draft), gap: 10 }}>
            {(['ar', 'en'] as Language[]).map(value => (
              <Pressable key={value} onPress={() => setDraft(value)} accessibilityRole="button"
                accessibilityState={{ selected: draft === value }}
                style={{ flex: 1, alignItems: 'center', minHeight: 52, borderRadius: 14, justifyContent: 'center', backgroundColor: draft === value ? C.forest : C.soft }}>
                <Text style={{ color: draft === value ? '#FFFFFF' : C.text, fontSize: 16, fontWeight: '900' }}>{t(draft, value === 'ar' ? 'arabic' : 'english')}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[S.card, S.shadow, { marginBottom: 16 }]}>
          <SectionLabel lang={draft}>{t(draft, 'themeMode')}</SectionLabel>
          <View style={{ flexDirection: rowDirection(draft), gap: 8 }}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map(value => {
              const selected = draftTheme === value;
              const labelKey = value === 'system' ? 'themeSystem' : value === 'light' ? 'themeLight' : 'themeDark';
              return (
                <Pressable key={value} onPress={() => setDraftTheme(value)} accessibilityRole="radio"
                  accessibilityState={{ selected }} accessibilityLabel={t(draft, labelKey)}
                  style={{ flex: 1, minHeight: 54, paddingHorizontal: 5, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? C.forest : C.soft, borderWidth: 1, borderColor: selected ? C.forest : C.border }}>
                  <Text style={{ color: selected ? '#FFFFFF' : C.text, fontSize: 13, fontWeight: '900', textAlign: 'center' }}>{t(draft, labelKey)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[S.card, { marginBottom: 18 }]}>
          <SectionLabel lang={draft}>{t(draft, 'permissions')}</SectionLabel>
          <Text style={[S.muted, { marginBottom: 12 }, dirStyle(draft)]}>
            {notificationAllowed ? '✓ ' : '• '}{t(draft, notificationAllowed ? 'notificationsEnabled' : 'notificationsOff')}
          </Text>
          {!notificationAllowed && <PrimaryButton label={t(draft, 'notificationsButton')} light onPress={onNotificationPermission} style={{ marginBottom: 15 }} />}
          {Platform.OS === 'android' && Number(Platform.Version) >= 31 && (
            <>
              <Text style={[S.muted, { marginBottom: 12 }, dirStyle(draft)]}>{t(draft, 'exactHelp')}</Text>
              <PrimaryButton label={t(draft, 'exactButton')} light onPress={onExactPermission} style={{ marginBottom: 13 }} />
            </>
          )}
          <Text style={[S.muted, { fontSize: 12 }, dirStyle(draft)]}>{t(draft, 'notificationCaption')}</Text>
        </View>
        <Text style={[S.muted, { textAlign: 'center', marginBottom: 17, fontSize: 12 }, dirStyle(draft)]}>{t(draft, 'privacyNote')}</Text>
        <PrimaryButton label={t(draft, 'saveChanges')} onPress={() => onSave(draft, draftTheme)} style={{ minHeight: 59 }} />
      </ScrollView>
    </View>
  );
}
