import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { AppState, ShoppingList } from '../domain/shopping';
import type { TemplateKind } from '../domain/templates';
import { formatNumber, formatTime, formatWeekdays, progressLabel, t } from '../i18n/strings';
import { C, S, dirStyle, rowDirection } from '../components/theme';
import { PageHeader, PrimaryButton, ProgressBar, SecondaryButton, SectionLabel } from '../components/Ui';
import AdBanner from '../components/AdBanner';

interface Props {
  state: AppState;
  onOpenList: (id: string) => void;
  onCreateList: () => void;
  onCreateTemplate: (kind: TemplateKind) => void;
  onSettings: () => void;
  onEditList: (id: string) => void;
}

function ListCard({ list, lang, onOpen, onEdit }: {
  list: ShoppingList; lang: AppState['preferences']['language']; onOpen: () => void; onEdit: () => void;
}) {
  const checked = list.items.filter(item => item.checked).length;
  const total = list.items.length;
  return (
    <View style={[S.card, S.shadow, { marginBottom: 13, padding: 17 }]}>
      <View style={{ flexDirection: rowDirection(lang), alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={[{ color: C.forestDeep, fontSize: 20, fontWeight: '900' }, dirStyle(lang)]}>{list.name}</Text>
          <Text style={[{ color: C.muted, fontSize: 13, marginTop: 6, lineHeight: 19 }, dirStyle(lang)]}>
            {`${list.schedule.enabled ? '' : `${t(lang, 'reminderDisabled')} · `}${formatWeekdays(lang, list.schedule.weekdays)} · ${formatTime(list.schedule.hour, list.schedule.minute, lang)}`}
          </Text>
        </View>
        <View style={{ borderRadius: 13, backgroundColor: C.peach, paddingHorizontal: 10, paddingVertical: 7 }}>
          <Text style={{ color: C.forestDeep, fontSize: 13, fontWeight: '900' }}>{progressLabel(lang, checked, total)}</Text>
        </View>
      </View>
      <View style={{ marginTop: 15, marginBottom: 9 }}>
        <ProgressBar checked={checked} total={total} rtl={lang === 'ar'} />
      </View>
      <Text style={[{ color: C.muted, fontSize: 12, marginBottom: 13 }, dirStyle(lang)]}>
        {`${formatNumber(checked, lang)} ${t(lang, 'progressCount')} · ${formatNumber(total - checked, lang)} ${t(lang, 'remaining')}`}
      </Text>
      <View style={{ flexDirection: rowDirection(lang), gap: 9 }}>
        <PrimaryButton label={t(lang, 'openList')} onPress={onOpen} style={{ flex: 1, minHeight: 47, borderRadius: 14 }} />
        <SecondaryButton label={t(lang, 'edit')} onPress={onEdit} style={{ minWidth: 74 }} />
      </View>
    </View>
  );
}

const TEMPLATE_CARDS: { kind: TemplateKind; key: 'templateWeekly' | 'templateTravel' | 'templateHousehold'; emoji: string }[] = [
  { kind: 'weekly', key: 'templateWeekly', emoji: '🛒' },
  { kind: 'travel', key: 'templateTravel', emoji: '🧳' },
  { kind: 'household', key: 'templateHousehold', emoji: '🧽' },
];

export default function Home({ state, onOpenList, onCreateList, onCreateTemplate, onSettings, onEditList }: Props) {
  const lang = state.preferences.language;
  return (
    <View style={S.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 }}>
        <PageHeader title={t(lang, 'appName')} lang={lang} action={t(lang, 'settings')} onAction={onSettings} />
        <View style={{ marginBottom: 22 }}>
          <Text style={[{ fontSize: 27, color: C.forestDeep, fontWeight: '900', marginBottom: 7 }, dirStyle(lang)]}>{t(lang, 'homeTitle')}</Text>
          <Text style={[S.muted, dirStyle(lang)]}>{t(lang, 'homeIntro')}</Text>
        </View>

        {state.lists.length === 0 ? (
          <View style={[S.card, { alignItems: 'center', padding: 24, paddingVertical: 30, marginBottom: 22 }]}>
            <Text style={{ fontSize: 47, marginBottom: 12 }}>🧺</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: C.forestDeep, textAlign: 'center' }}>{t(lang, 'noListsTitle')}</Text>
            <Text style={[S.muted, { textAlign: 'center', marginTop: 9, maxWidth: 300 }]}>{t(lang, 'noListsBody')}</Text>
            <PrimaryButton label={t(lang, 'createFirstList')} onPress={onCreateList} style={{ marginTop: 20, width: '100%' }} />
          </View>
        ) : (
          <>
            <SectionLabel lang={lang}>{t(lang, 'homeTitle')}</SectionLabel>
            {state.lists.map(list => (
              <ListCard key={list.id} list={list} lang={lang} onOpen={() => onOpenList(list.id)} onEdit={() => onEditList(list.id)} />
            ))}
            <PrimaryButton label={`＋  ${t(lang, 'addList')}`} onPress={onCreateList} style={{ marginTop: 3, marginBottom: 22 }} />
          </>
        )}

        <View style={{ marginTop: state.lists.length === 0 ? 0 : 2, marginBottom: 10 }}>
          <SectionLabel lang={lang}>{t(lang, 'templatesTitle')}</SectionLabel>
          <Text style={[S.muted, { marginBottom: 13 }, dirStyle(lang)]}>{t(lang, 'templatesBody')}</Text>
          {TEMPLATE_CARDS.map(template => (
            <View key={template.kind} style={[S.card, { marginBottom: 10, padding: 15, flexDirection: rowDirection(lang), alignItems: 'center', gap: 12 }]}>
              <View style={{ width: 47, height: 47, borderRadius: 15, backgroundColor: C.peach, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>{template.emoji}</Text>
              </View>
              <Text style={[{ flex: 1, color: C.forestDeep, fontSize: 16, fontWeight: '800' }, dirStyle(lang)]}>{t(lang, template.key)}</Text>
              <SecondaryButton label={t(lang, 'useTemplate')} onPress={() => onCreateTemplate(template.kind)} style={{ minWidth: 100, minHeight: 44 }} />
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={{ backgroundColor: C.page, paddingHorizontal: 12, paddingBottom: 3, borderTopWidth: 1, borderTopColor: C.border }}>
        <AdBanner />
      </View>
    </View>
  );
}
