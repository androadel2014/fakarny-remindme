import React from 'react';
import { Text, View } from 'react-native';
import type { Language } from '../domain/shopping';
import { t } from '../i18n/strings';
import { C, S, dirStyle } from '../components/theme';
import { PrimaryButton } from '../components/Ui';

export default function Intro({ lang, onContinue }: { lang: Language; onContinue: () => void }) {
  return (
    <View style={[S.screen, { padding: 24, justifyContent: 'center' }]}>
      <View style={[S.card, S.shadow, { padding: 25, borderRadius: 28 }]}>
        <View style={{ width: 82, height: 82, borderRadius: 27, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 22 }}>
          <Text style={{ fontSize: 43 }}>🛒</Text>
        </View>
        <Text style={[{ color: C.forestDeep, fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12 }, dirStyle(lang)]}>{t(lang, 'introTitle')}</Text>
        <Text style={[S.muted, { fontSize: 16, lineHeight: 25, textAlign: 'center', marginBottom: 25 }, dirStyle(lang)]}>{t(lang, 'introBody')}</Text>
        <PrimaryButton label={t(lang, 'introButton')} onPress={onContinue} style={{ minHeight: 60 }} />
      </View>
    </View>
  );
}
