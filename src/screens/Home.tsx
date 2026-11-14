import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import type { Language, ShoppingItem, ShoppingState } from '../domain/shopping';
import { countdownParts, nextShoppingAt } from '../domain/shopping';
import { dayLabel, formatTime, t } from '../i18n/strings';
import { C, S, dirStyle, rowDirection } from '../components/theme';
import { PageHeader, PrimaryButton } from '../components/Ui';

interface Props {
  state: ShoppingState;
  now: Date;
  onAdd: () => void;
  onSettings: () => void;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onFinish: () => void;
}

function ItemCard({ item, language, onToggle, onEdit, onDelete }: {
  item: ShoppingItem; language: Language; onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const checked = item.checked;
  return (
    <View style={[S.card, S.shadow, { paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10, flexDirection: rowDirection(language), alignItems: 'center', gap: 10, opacity: checked ? .77 : 1 }]}>
      <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }}
        accessibilityLabel={`${item.name}: ${t(language, checked ? 'checkedLabel' : 'uncheckedLabel')}`}
        style={{ width: 50, height: 50, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 29, height: 29, borderRadius: 10, borderWidth: 2, borderColor: checked ? C.forest : C.border, backgroundColor: checked ? C.forest : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          {checked && <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', lineHeight: 24 }}>✓</Text>}
        </View>
      </Pressable>
      <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={`${t(language, 'edit')} ${item.name}`}
        style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}>
        <Text style={[{ color: checked ? C.muted : C.text, fontSize: 17, fontWeight: checked ? '500' : '700', textDecorationLine: checked ? 'line-through' : 'none' }, dirStyle(language)]}>{item.name}</Text>
      </Pressable>
      <Pressable onPress={onEdit} accessibilityLabel={`${t(language, 'edit')} ${item.name}`} accessibilityRole="button"
        style={{ width: 39, height: 44, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.forest, fontSize: 20 }}>✎</Text>
      </Pressable>
      <Pressable onPress={onDelete} accessibilityLabel={`${t(language, 'delete')} ${item.name}`} accessibilityRole="button"
        style={{ width: 39, height: 44, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.coral, fontSize: 21 }}>×</Text>
      </Pressable>
    </View>
  );
}

export default function Home({ state, now, onAdd, onSettings, onToggle, onEdit, onDelete, onFinish }: Props) {
  const lang = state.preferences.language;
  const remaining = state.items.filter(item => !item.checked);
  const completed = state.items.length - remaining.length;
  const next = nextShoppingAt(now, state.preferences);
  const countdown = countdownParts(now, next);
  const dateLabel = next.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
  const confirmDelete = (item: ShoppingItem) => Alert.alert(t(lang, 'deleteConfirmTitle'),
    `${item.name}\n${t(lang, 'deleteConfirmBody')}`,
    [{ text: t(lang, 'cancel'), style: 'cancel' }, { text: t(lang, 'delete'), style: 'destructive', onPress: () => onDelete(item.id) }]);
  const confirmFinish = () => Alert.alert(t(lang, 'finishConfirmTitle'), t(lang, 'finishConfirmBody'),
    [{ text: t(lang, 'cancel'), style: 'cancel' }, { text: t(lang, 'finishNow'), onPress: onFinish }]);

  return (
    <View style={S.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 124 }}>
        <PageHeader title={t(lang, 'appName')} lang={lang} action={`⚙  ${t(lang, 'settings')}`} onAction={onSettings} />
        <View style={{ marginBottom: 24 }}>
          <Text style={[{ fontSize: 15, color: C.muted, marginBottom: 4 }, dirStyle(lang)]}>{t(lang, 'tagLine')}</Text>
          <Text style={[{ fontSize: 28, fontWeight: '800', color: C.forestDeep }, dirStyle(lang)]}>{t(lang, 'hello')}</Text>
        </View>
        <View style={[S.card, { backgroundColor: C.forest, borderColor: C.forest, borderRadius: 27, padding: 21, marginBottom: 22, overflow: 'hidden' }]}>
          <View style={{ flexDirection: rowDirection(lang), alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={[{ color: '#CFE4D6', fontSize: 14, fontWeight: '700' }, dirStyle(lang)]}>{t(lang, 'nextShop')}</Text>
              <Text style={[{ color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 7 }, dirStyle(lang)]}>{dayLabel(lang, state.preferences.weekday)} · {formatTime(state.preferences.hour, state.preferences.minute, lang)}</Text>
              <Text style={[{ color: '#D2E5D8', fontSize: 14, marginTop: 5 }, dirStyle(lang)]}>{dateLabel}</Text>
            </View>
            <View style={{ width: 59, height: 59, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 31 }}>🛒</Text>
            </View>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, marginTop: 18, paddingVertical: 12, paddingHorizontal: 8, flexDirection: rowDirection(lang), justifyContent: 'space-around' }}>
            {([
              [countdown.days, t(lang, 'days')], [countdown.hours, t(lang, 'hours')], [countdown.minutes, t(lang, 'minutes')],
            ] as [number, string][]).map(([number, label], i) => (
              <View key={i} style={{ alignItems: 'center', minWidth: 65 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 24 }}>{number}</Text>
                <Text style={{ color: '#D1E6D8', fontSize: 12 }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: rowDirection(lang), justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }}>
          <Text style={[S.subhead, dirStyle(lang)]}>{t(lang, 'listLabel')}</Text>
          <View style={{ flexDirection: rowDirection(lang), gap: 8 }}>
            <View style={{ borderRadius: 99, backgroundColor: C.mint, paddingVertical: 7, paddingHorizontal: 10 }}>
              <Text style={{ color: C.forest, fontWeight: '800', fontSize: 12 }}>{remaining.length} {t(lang, 'remaining')}</Text>
            </View>
            <View style={{ borderRadius: 99, backgroundColor: C.peach, paddingVertical: 7, paddingHorizontal: 10 }}>
              <Text style={{ color: '#9A6333', fontWeight: '800', fontSize: 12 }}>{completed} {t(lang, 'bought')}</Text>
            </View>
          </View>
        </View>
        {state.items.length === 0 || remaining.length === 0 ? (
          <View style={[S.card, { alignItems: 'center', padding: 24, paddingVertical: 35, marginBottom: 17 }]}>
            <Text style={{ fontSize: 51, marginBottom: 14 }}>{state.items.length === 0 ? '🧺' : '✨'}</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.forestDeep, textAlign: 'center' }}>{t(lang, state.items.length === 0 ? 'noItemsTitle' : 'allDoneTitle')}</Text>
            <Text style={[S.muted, { textAlign: 'center', marginTop: 9, maxWidth: 280 }]}>{t(lang, state.items.length === 0 ? 'noItemsBody' : 'allDoneBody')}</Text>
          </View>
        ) : null}
        {state.items.map(item => <ItemCard key={item.id} item={item} language={lang}
          onToggle={() => onToggle(item.id)} onEdit={() => onEdit(item.id)} onDelete={() => confirmDelete(item)} />)}
        {state.items.length > 0 && (
          <PrimaryButton label={`✓  ${t(lang, 'finish')}`} onPress={confirmFinish} light style={{ marginTop: 15, marginBottom: 14 }} />
        )}
        <Text style={[S.muted, { fontSize: 12, textAlign: 'center', marginTop: 15 }]}>{t(lang, 'noAds')}</Text>
      </ScrollView>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.page, paddingHorizontal: 20, paddingTop: 13, paddingBottom: 23, borderTopWidth: 1, borderTopColor: C.border }}>
        <PrimaryButton label={`＋  ${t(lang, 'newItem')}`} onPress={onAdd} style={{ minHeight: 61, borderRadius: 20 }} />
      </View>
    </View>
  );
}
