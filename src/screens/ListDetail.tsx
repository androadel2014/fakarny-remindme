import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import type { Language, ShoppingList } from '../domain/shopping';
import { formatTime, formatWeekdays, progressLabel, t } from '../i18n/strings';
import { C, S, dirStyle, rowDirection } from '../components/theme';
import { PageHeader, PrimaryButton, SecondaryButton, SectionLabel } from '../components/Ui';

interface Props {
  list: ShoppingList;
  lang: Language;
  onBack: () => void;
  onEditList: () => void;
  onAddItem: () => void;
  onToggle: (id: string) => void;
  onEditItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onFinish: () => void;
  onShare: () => void;
  onDeleteList: () => void;
}

function ItemRow({ name, checked, lang, onToggle, onEdit, onDelete }:
  { name: string; checked: boolean; lang: Language; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={[S.card, { flexDirection: rowDirection(lang), alignItems: 'center', gap: 10, padding: 12, marginBottom: 9, borderRadius: 17 }]}>
      <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={`${t(lang, checked ? 'checked' : 'unchecked')}: ${name}`}
        style={{ width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: checked ? C.forest : '#B8C3B6', backgroundColor: checked ? C.forest : C.paper, alignItems: 'center', justifyContent: 'center' }}>
        {checked && <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 17 }}>✓</Text>}
      </Pressable>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={`${t(lang, checked ? 'unchecked' : 'checked')}: ${name}`} style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}>
        <Text style={[{ color: checked ? C.muted : C.text, fontSize: 16, fontWeight: '700', textDecorationLine: checked ? 'line-through' : 'none' }, dirStyle(lang)]}>{name}</Text>
        <Text style={[{ color: C.muted, fontSize: 11, marginTop: 3 }, dirStyle(lang)]}>{t(lang, checked ? 'checked' : 'unchecked')}</Text>
      </Pressable>
      <SecondaryButton label={t(lang, 'edit')} onPress={onEdit} style={{ minWidth: 59, minHeight: 40, paddingHorizontal: 9 }} />
      <SecondaryButton label={t(lang, 'delete')} danger onPress={onDelete} style={{ minWidth: 59, minHeight: 40, paddingHorizontal: 9 }} />
    </View>
  );
}

export default function ListDetail({ list, lang, onBack, onEditList, onAddItem, onToggle, onEditItem, onDeleteItem, onFinish, onShare, onDeleteList }: Props) {
  const checked = list.items.filter(item => item.checked).length;
  const total = list.items.length;
  const askFinish = () => Alert.alert(t(lang, 'finishConfirmTitle'), t(lang, 'finishConfirmBody'), [
    { text: t(lang, 'cancel'), style: 'cancel' },
    { text: t(lang, 'finishConfirmAction'), onPress: onFinish },
  ]);
  const askDeleteList = () => Alert.alert(t(lang, 'deleteListConfirmTitle'), t(lang, 'deleteListConfirmBody'), [
    { text: t(lang, 'cancel'), style: 'cancel' },
    { text: t(lang, 'deleteList'), style: 'destructive', onPress: onDeleteList },
  ]);
  const askDeleteItem = (id: string, name: string) => Alert.alert(t(lang, 'deleteItemTitle'), `${name}\n${t(lang, 'deleteItemBody')}`, [
    { text: t(lang, 'cancel'), style: 'cancel' },
    { text: t(lang, 'delete'), style: 'destructive', onPress: () => onDeleteItem(id) },
  ]);

  return (
    <View style={S.screen}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
        <PageHeader title={list.name} lang={lang} onBack={onBack} action={t(lang, 'editList')} onAction={onEditList} />
        <View style={[S.card, S.shadow, { backgroundColor: C.forest, borderColor: C.forest, marginBottom: 17, padding: 19 }]}>
          <View style={{ flexDirection: rowDirection(lang), justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <Text style={[{ color: '#D7E8DC', fontWeight: '700', fontSize: 13 }, dirStyle(lang)]}>{t(lang, 'progress')}</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 20 }}>{progressLabel(lang, checked, total)}</Text>
          </View>
          <View style={{ height: 9, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 12, overflow: 'hidden', flexDirection: rowDirection(lang) }}>
            <View style={{ height: '100%', width: `${total > 0 ? (checked / total) * 100 : 0}%`, backgroundColor: '#FFFFFF', borderRadius: 99 }} />
          </View>
          <View style={{ marginTop: 15, flexDirection: rowDirection(lang), alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={[{ color: '#FFFFFF', fontWeight: '700', fontSize: 13, flex: 1 }, dirStyle(lang)]}>
              {`${list.schedule.enabled ? '' : `${t(lang, 'reminderDisabled')} · `}${formatWeekdays(lang, list.schedule.weekdays)} · ${formatTime(list.schedule.hour, list.schedule.minute, lang)}`}
            </Text>
            <Text style={{ color: '#D7E8DC', fontSize: 12, fontWeight: '800' }}>{t(lang, list.schedule.enabled ? 'reminderEnabled' : 'reminderDisabled')}</Text>
          </View>
        </View>

        <View style={{ flexDirection: rowDirection(lang), alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <SectionLabel lang={lang}>{t(lang, 'items')}</SectionLabel>
          <Text style={{ color: C.forest, fontSize: 13, fontWeight: '900' }}>{progressLabel(lang, checked, total)}</Text>
        </View>

        {total === 0 ? (
          <View style={[S.card, { alignItems: 'center', padding: 25, marginBottom: 14 }]}>
            <Text style={{ fontSize: 44, marginBottom: 11 }}>🧺</Text>
            <Text style={{ color: C.forestDeep, fontSize: 19, fontWeight: '900', textAlign: 'center' }}>{t(lang, 'emptyListTitle')}</Text>
            <Text style={[S.muted, { textAlign: 'center', marginTop: 8 }]}>{t(lang, 'emptyListBody')}</Text>
          </View>
        ) : (
          <>
            {list.items.map(item => (
              <ItemRow key={item.id} name={item.name} checked={item.checked} lang={lang}
                onToggle={() => onToggle(item.id)} onEdit={() => onEditItem(item.id)} onDelete={() => askDeleteItem(item.id, item.name)} />
            ))}
            {checked === total && total > 0 && (
              <View style={[S.card, { backgroundColor: C.mint, borderColor: C.mint, marginTop: 3, marginBottom: 13 }]}>
                <Text style={[{ color: C.forestDeep, fontSize: 18, fontWeight: '900', textAlign: 'center' }]}>{t(lang, 'allDoneTitle')}</Text>
                <Text style={[S.muted, { textAlign: 'center', marginTop: 7 }]}>{t(lang, 'allDoneBody')}</Text>
              </View>
            )}
          </>
        )}

        <PrimaryButton label={`＋  ${t(lang, 'addItem')}`} onPress={onAddItem} style={{ marginTop: 5, marginBottom: 10 }} />
        <SecondaryButton label={t(lang, 'shareList')} onPress={onShare} style={{ marginBottom: 10 }} />
        {total > 0 && <PrimaryButton label={t(lang, 'finishShopping')} light onPress={askFinish} style={{ marginBottom: 10 }} />}
        <SecondaryButton label={t(lang, 'deleteList')} danger onPress={askDeleteList} />
      </ScrollView>
    </View>
  );
}
