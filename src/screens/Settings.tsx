import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import type { Language } from '../domain/shopping';
import { t } from '../i18n/strings';
import { C, S, dirStyle, rowDirection } from '../components/theme';
import { PageHeader, PrimaryButton, SectionLabel } from '../components/Ui';

interface Props {
  language: Language;
  notificationAllowed: boolean;
  onClose: () => void;
  onSave: (language: Language) => void;
  onNotificationPermission: () => void;
  onExactPermission: () => void;
}

export default function Settings({ language, notificationAllowed, onClose, onSave, onNotificationPermission, onExactPermission }: Props) {
  const [draft, setDraft] = useState<Language>(language);
  useEffect(() => setDraft(language), [language]);

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
        <PrimaryButton label={t(draft, 'saveChanges')} onPress={() => onSave(draft)} style={{ minHeight: 59 }} />
      </ScrollView>
    </View>
  );
}
