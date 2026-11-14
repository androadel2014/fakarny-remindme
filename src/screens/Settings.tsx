import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { Language, Preferences, Weekday } from '../domain/shopping';
import { dayLabel, formatTime, t } from '../i18n/strings';
import { C, S, dirStyle, rowDirection } from '../components/theme';
import { PageHeader, PrimaryButton, SectionLabel } from '../components/Ui';

interface Props {
  preferences: Preferences;
  notificationAllowed: boolean;
  exactAllowed: boolean;
  onClose: () => void;
  onSave: (preferences: Preferences) => void;
  onNotificationPermission: () => void;
  onExactPermission: () => void;
}

export default function Settings({ preferences, notificationAllowed, exactAllowed, onClose, onSave, onNotificationPermission, onExactPermission }: Props) {
  const [draft, setDraft] = useState<Preferences>({ ...preferences });
  const [showIosTime, setShowIosTime] = useState(false);
  const lang: Language = draft.language;
  const value = new Date(2026, 5, 1, draft.hour, draft.minute);
  const weekdayValues: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => { setDraft({ ...preferences }); }, [preferences]);

  const onTimeChanged = (event: DateTimePickerEvent, time?: Date) => {
    if (time && event.type !== 'dismissed') {
      setDraft(previous => ({ ...previous, hour: time.getHours(), minute: time.getMinutes() }));
    }
  };
  const openTimePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value, mode: 'time', is24Hour: false, onChange: onTimeChanged });
    } else setShowIosTime(current => !current);
  };

  return (
    <View style={S.screen}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 45 }}>
        <PageHeader title={t(lang, 'settingsTitle')} lang={lang} onBack={onClose} />
        <View style={[S.card, S.shadow, { marginBottom: 16 }]}>
          <SectionLabel lang={lang}>{t(lang, 'shoppingDay')}</SectionLabel>
          <View style={{ flexDirection: rowDirection(lang), flexWrap: 'wrap', gap: 9, marginTop: 7 }}>
            {weekdayValues.map(day => (
              <Pressable key={day} accessibilityRole="button" accessibilityState={{ selected: day === draft.weekday }}
                accessibilityLabel={dayLabel(lang, day)} onPress={() => setDraft(old => ({ ...old, weekday: day }))}
                style={{ borderRadius: 13, backgroundColor: draft.weekday === day ? C.forest : C.soft,
                  minHeight: 47, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '800', color: draft.weekday === day ? '#FFFFFF' : C.text, fontSize: 15 }}>{dayLabel(lang, day)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={[S.card, S.shadow, { marginBottom: 16 }]}>
          <SectionLabel lang={lang}>{t(lang, 'alarmTime')}</SectionLabel>
          <Pressable accessibilityRole="button" onPress={openTimePicker} accessibilityLabel={t(lang, 'alarmTime')}
            style={{ flexDirection: rowDirection(lang), justifyContent: 'space-between', alignItems: 'center', borderRadius: 15, backgroundColor: C.peach, minHeight: 63, paddingHorizontal: 17 }}>
            <Text style={{ color: C.forestDeep, fontWeight: '900', fontSize: 27 }}>{formatTime(draft.hour, draft.minute, lang)}</Text>
            <Text style={{ color: C.forest, fontSize: 25 }}>◷</Text>
          </Pressable>
          {Platform.OS === 'ios' && showIosTime && (
            <DateTimePicker value={value} mode="time" display="spinner" onChange={onTimeChanged} />
          )}
          <Text style={[S.muted, { marginTop: 12 }, dirStyle(lang)]}>{t(lang, 'reminderInfo')}</Text>
        </View>
        <View style={[S.card, S.shadow, { marginBottom: 16 }]}>
          <SectionLabel lang={lang}>{t(lang, 'language')}</SectionLabel>
          <View style={{ flexDirection: rowDirection(lang), gap: 10 }}>
            {(['ar', 'en'] as Language[]).map(language => (
              <Pressable key={language} onPress={() => setDraft(old => ({ ...old, language }))}
                accessibilityRole="button" accessibilityState={{ selected: draft.language === language }}
                style={{ flex: 1, alignItems: 'center', minHeight: 51, borderRadius: 14, justifyContent: 'center', backgroundColor: draft.language === language ? C.forest : C.soft }}>
                <Text style={{ color: draft.language === language ? '#FFFFFF' : C.text, fontSize: 16, fontWeight: '800' }}>{t(lang, language === 'ar' ? 'arabic' : 'english')}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={[S.card, { marginBottom: 22 }]}>
          <SectionLabel lang={lang}>{t(lang, 'permissions')}</SectionLabel>
          <Text style={[S.muted, { marginBottom: 11 }, dirStyle(lang)]}> {notificationAllowed ? '✓ ' : '! '}{t(lang, notificationAllowed ? 'notificationsEnabled' : 'notificationsOff')}</Text>
          {!notificationAllowed && <PrimaryButton label={t(lang, 'notificationsButton')} onPress={onNotificationPermission} light style={{ marginBottom: 14 }} />}
          {Platform.OS === 'android' && (
            <>
              <Text style={[S.muted, { marginBottom: 10 }, dirStyle(lang)]}>{exactAllowed ? '✓ ' : '! '}{t(lang, exactAllowed ? 'exactOn' : 'exactOff')}</Text>
              {!exactAllowed && <PrimaryButton label={t(lang, 'exactButton')} onPress={onExactPermission} light style={{ marginBottom: 14 }} />}
            </>
          )}
          <Text style={[S.muted, { fontSize: 12 }, dirStyle(lang)]}>{t(lang, 'notificationCaption')}</Text>
        </View>
        <PrimaryButton label={t(lang, 'saveSettings')} onPress={() => onSave(draft)} style={{ minHeight: 62 }} />
      </ScrollView>
    </View>
  );
}
