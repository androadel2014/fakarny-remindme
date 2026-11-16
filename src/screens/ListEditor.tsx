import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { isValidMonthlyDay, type Language, type ListSchedule, type ScheduleCadence, type ShoppingList, type Weekday } from '../domain/shopping';
import { dayLabel, formatNumber, formatTime, t } from '../i18n/strings';
import { C, S, dirStyle, rowDirection } from '../components/theme';
import { PageHeader, PrimaryButton, SecondaryButton, SectionLabel } from '../components/Ui';

interface Props {
  lang: Language;
  list?: ShoppingList;
  onClose: () => void;
  onSave: (name: string, schedule: ListSchedule) => void;
}

const DEFAULT_SCHEDULE: ListSchedule = { enabled: true, cadence: 'weekly', weekdays: [1], hour: 10, minute: 0 };
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
const MONTH_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

function parseLocalizedInteger(value: string): number | null {
  const normalized = value
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[^0-9]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? parsed : null;
}

export default function ListEditor({ lang, list, onClose, onSave }: Props) {
  const [name, setName] = useState(list?.name ?? '');
  const [schedule, setSchedule] = useState<ListSchedule>({ ...(list?.schedule ?? DEFAULT_SCHEDULE), weekdays: [...(list?.schedule.weekdays ?? DEFAULT_SCHEDULE.weekdays)] });
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [draftHour, setDraftHour] = useState(formatNumber(list?.schedule.hour ?? DEFAULT_SCHEDULE.hour, lang));
  const [draftMinute, setDraftMinute] = useState(formatNumber(list?.schedule.minute ?? DEFAULT_SCHEDULE.minute, lang));

  const openTimePicker = () => {
    setDraftHour(formatNumber(schedule.hour, lang));
    setDraftMinute(formatNumber(schedule.minute, lang));
    setShowTimeModal(true);
  };
  const changeCadence = (cadence: ScheduleCadence) => {
    setSchedule(previous => ({
      ...previous,
      cadence,
      weekdays: cadence === 'weekly' && previous.weekdays.length === 0 ? [1] : previous.weekdays,
      dayOfMonth: previous.dayOfMonth ?? 1,
    }));
  };
  const toggleDay = (day: Weekday) => {
    setSchedule(previous => ({
      ...previous,
      weekdays: previous.weekdays.includes(day)
        ? previous.weekdays.filter(value => value !== day)
        : [...previous.weekdays, day].sort((a, b) => a - b),
    }));
  };
  function saveTime() {
    const hour = parseLocalizedInteger(draftHour);
    const minute = parseLocalizedInteger(draftMinute);
    if (hour === null || minute === null || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      Alert.alert(t(lang, 'reminderTime'), t(lang, 'invalidTime'));
      return;
    }
    setSchedule(previous => ({ ...previous, hour, minute }));
    setShowTimeModal(false);
  }
  function submit() {
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert(t(lang, 'listName'), t(lang, 'emptyListName'));
      return;
    }
    if (schedule.cadence === 'monthly') {
      if (!isValidMonthlyDay(schedule.dayOfMonth ?? 0)) return;
    } else if (schedule.enabled && schedule.weekdays.length === 0) {
      Alert.alert(t(lang, 'reminderTitle'), t(lang, 'chooseAtLeastOneDay'));
      return;
    }
    onSave(cleanName, schedule);
  }

  return (
    <View style={S.screen}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 35 }} keyboardShouldPersistTaps="handled">
        <PageHeader title={t(lang, list ? 'editList' : 'createList')} lang={lang} onBack={onClose} />
        <View style={[S.card, S.shadow, { marginBottom: 16 }]}>
          <SectionLabel lang={lang}>{t(lang, 'listName')}</SectionLabel>
          <TextInput value={name} onChangeText={setName} maxLength={80} placeholder={t(lang, 'listNamePlaceholder')}
            placeholderTextColor="#9A9E94" autoCapitalize="words" returnKeyType="done" accessibilityLabel={t(lang, 'listName')}
            style={[S.input, dirStyle(lang)]} />
          <Text style={[S.muted, { marginTop: 10 }, dirStyle(lang)]}>{t(lang, 'listNameHelp')}</Text>
        </View>

        <View style={[S.card, S.shadow, { marginBottom: 16 }]}>
          <View style={{ flexDirection: rowDirection(lang), alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <SectionLabel lang={lang}>{t(lang, 'reminderTitle')}</SectionLabel>
            <Pressable onPress={() => setSchedule(previous => ({ ...previous, enabled: !previous.enabled }))}
              accessibilityRole="switch" accessibilityState={{ checked: schedule.enabled }}
              style={{ backgroundColor: schedule.enabled ? C.mint : C.soft, borderRadius: 14, paddingHorizontal: 13, minHeight: 42, justifyContent: 'center' }}>
              <Text style={{ color: schedule.enabled ? C.forest : C.muted, fontWeight: '900' }}>{t(lang, schedule.enabled ? 'reminderOff' : 'reminderOn')}</Text>
            </Pressable>
          </View>
          {!schedule.enabled && <Text style={[S.muted, { marginBottom: 14 }, dirStyle(lang)]}>{t(lang, 'reminderDisabled')}</Text>}
          <>
              <SectionLabel lang={lang}>{t(lang, 'reminderCadence')}</SectionLabel>
              <View style={{ flexDirection: rowDirection(lang), gap: 10, marginBottom: 20 }}>
                {(['weekly', 'monthly'] as const).map(cadence => {
                  const selected = (schedule.cadence ?? 'weekly') === cadence;
                  return (
                    <Pressable key={cadence} onPress={() => changeCadence(cadence)} accessibilityRole="radio"
                      accessibilityState={{ selected }} accessibilityLabel={t(lang, cadence === 'weekly' ? 'cadenceWeekly' : 'cadenceMonthly')}
                      style={{ flex: 1, minHeight: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? C.forest : C.soft, borderWidth: 1, borderColor: selected ? C.forest : C.border }}>
                      <Text style={{ color: selected ? '#FFFFFF' : C.text, fontWeight: '900', fontSize: 15 }}>
                        {t(lang, cadence === 'weekly' ? 'cadenceWeekly' : 'cadenceMonthly')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {schedule.cadence === 'monthly' ? (
                <>
                  <SectionLabel lang={lang}>{t(lang, 'monthlyDay')}</SectionLabel>
                  <View style={{ flexDirection: rowDirection(lang), flexWrap: 'wrap', gap: 8 }}>
                    {MONTH_DAYS.map(day => {
                      const selected = (schedule.dayOfMonth ?? 1) === day;
                      return (
                        <Pressable key={day} onPress={() => setSchedule(previous => ({ ...previous, dayOfMonth: day }))}
                          accessibilityRole="radio" accessibilityState={{ selected }}
                          accessibilityLabel={`${t(lang, 'monthlyDayLabel')} ${formatNumber(day, lang)}`}
                          style={{ width: 43, minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 12,
                            backgroundColor: selected ? C.forest : C.soft, borderWidth: 1, borderColor: selected ? C.forest : C.border }}>
                          <Text style={{ color: selected ? '#FFFFFF' : C.text, fontWeight: '800', fontSize: 14 }}>{formatNumber(day, lang)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={[S.muted, { marginTop: 10, marginBottom: 18 }, dirStyle(lang)]}>{t(lang, 'monthlyDayHint')}</Text>
                </>
              ) : (
                <>
                  <SectionLabel lang={lang}>{t(lang, 'reminderDays')}</SectionLabel>
                  <View style={{ flexDirection: rowDirection(lang), flexWrap: 'wrap', gap: 8 }}>
                    {WEEKDAYS.map(day => {
                      const selected = schedule.weekdays.includes(day);
                      return (
                        <Pressable key={day} onPress={() => toggleDay(day)} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}
                          accessibilityLabel={dayLabel(lang, day)}
                          style={{ backgroundColor: selected ? C.forest : C.soft, borderRadius: 12, minHeight: 43, paddingHorizontal: 12,
                            justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: selected ? C.forest : C.border }}>
                          <Text style={{ color: selected ? '#FFFFFF' : C.text, fontWeight: '800', fontSize: 13 }}>{dayLabel(lang, day)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={[S.muted, { marginTop: 10, marginBottom: 18 }, dirStyle(lang)]}>{t(lang, 'chooseDaysHint')}</Text>
                </>
              )}
              <SectionLabel lang={lang}>{t(lang, 'reminderTime')}</SectionLabel>
              <Pressable accessibilityRole="button" onPress={openTimePicker} accessibilityLabel={t(lang, 'reminderTime')}
                style={{ flexDirection: rowDirection(lang), justifyContent: 'space-between', alignItems: 'center', borderRadius: 15, backgroundColor: C.peach, minHeight: 62, paddingHorizontal: 17 }}>
                <Text style={{ color: C.forestDeep, fontWeight: '900', fontSize: 26 }}>{formatTime(schedule.hour, schedule.minute, lang)}</Text>
                <Text style={{ color: C.forest, fontSize: 15, fontWeight: '800' }}>{t(lang, 'changeTime')}</Text>
              </Pressable>
          </>
        </View>
        <PrimaryButton label={t(lang, list ? 'saveList' : 'createList')} onPress={submit} disabled={!name.trim() || (schedule.cadence === 'monthly'
          ? !isValidMonthlyDay(schedule.dayOfMonth ?? 0)
          : (schedule.enabled && schedule.weekdays.length === 0))} style={{ minHeight: 60 }} />
      </ScrollView>

      <Modal visible={showTimeModal} transparent animationType="fade" onRequestClose={() => setShowTimeModal(false)}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 22, backgroundColor: C.overlay }}>
          <View style={[S.card, { padding: 22, borderRadius: 25 }]}>
            <Text style={[{ color: C.forestDeep, fontSize: 21, fontWeight: '900', marginBottom: 16 }, dirStyle(lang)]}>{t(lang, 'timePickerTitle')}</Text>
            <View style={{ flexDirection: rowDirection(lang), gap: 12 }}>
              <View style={{ flex: 1 }}>
                <SectionLabel lang={lang}>{t(lang, 'hour')}</SectionLabel>
                <TextInput value={draftHour} onChangeText={setDraftHour} keyboardType="number-pad" maxLength={2}
                  accessibilityLabel={t(lang, 'hour')} style={[S.input, { textAlign: 'center', fontSize: 22 }]} />
              </View>
              <View style={{ flex: 1 }}>
                <SectionLabel lang={lang}>{t(lang, 'minute')}</SectionLabel>
                <TextInput value={draftMinute} onChangeText={setDraftMinute} keyboardType="number-pad" maxLength={2}
                  accessibilityLabel={t(lang, 'minute')} style={[S.input, { textAlign: 'center', fontSize: 22 }]} />
              </View>
            </View>
            <Text style={[S.muted, { marginTop: 10, marginBottom: 19 }, dirStyle(lang)]}>{t(lang, 'timeRangeHint')}</Text>
            <PrimaryButton label={t(lang, 'saveTime')} onPress={saveTime} />
            <SecondaryButton label={t(lang, 'cancel')} onPress={() => setShowTimeModal(false)} style={{ marginTop: 9 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
