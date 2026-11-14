import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import type { Language, RecognitionLanguage, ShoppingItem } from '../domain/shopping';
import { t } from '../i18n/strings';
import { C, S, dirStyle, rowDirection } from '../components/theme';
import { PageHeader, PrimaryButton, SectionLabel } from '../components/Ui';

interface Props {
  lang: Language;
  item?: ShoppingItem;
  onClose: () => void;
  onSave: (name: string) => void;
}

type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

/** The native module is loaded only on an installed build, not in Expo Go. */
function getSpeechModule(): SpeechModule | null {
  if (!!Constants.expoGoConfig) return null;
  try {
    return (require('expo-speech-recognition') as typeof import('expo-speech-recognition')).ExpoSpeechRecognitionModule;
  } catch {
    return null;
  }
}

export default function ItemEditor({ lang, item, onClose, onSave }: Props) {
  const [name, setName] = useState(item?.name ?? '');
  const [voiceLocale, setVoiceLocale] = useState<RecognitionLanguage>(lang === 'ar' ? 'ar-EG' : 'en-US');
  const [listening, setListening] = useState(false);
  const baseText = useRef('');
  const speech = useRef<SpeechModule | null>(null);
  const voiceLocaleText = voiceLocale === 'ar-EG' ? t(lang, 'voiceArabic') : t(lang, 'voiceEnglish');

  useEffect(() => {
    const module = getSpeechModule();
    speech.current = module;
    if (!module) return;
    const start = module.addListener('start', () => setListening(true));
    const end = module.addListener('end', () => setListening(false));
    const result = module.addListener('result', event => {
      const words = event.results?.[0]?.transcript?.trim();
      if (words) setName(baseText.current ? `${baseText.current} ${words}` : words);
    });
    const error = module.addListener('error', () => {
      setListening(false);
      Alert.alert(t(lang, 'voiceUnavailable'), t(lang, 'listeningError'));
    });
    return () => {
      start.remove(); end.remove(); result.remove(); error.remove();
      try { module.abort(); } catch { /* Recognition may already be stopped. */ }
    };
  }, [lang]);

  async function toggleSpeech(): Promise<void> {
    const module = speech.current;
    if (!module) {
      Alert.alert(t(lang, 'voiceUnavailable'), !!Constants.expoGoConfig
        ? t(lang, 'voiceGoMessage') : t(lang, 'voiceDeviceMessage'));
      return;
    }
    if (listening) {
      try { module.stop(); } catch { setListening(false); }
      return;
    }
    try {
      const permissions = await module.requestPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert(t(lang, 'voiceUnavailable'), t(lang, 'voicePermission'));
        return;
      }
      baseText.current = name.trim();
      module.start({ lang: voiceLocale, interimResults: true, continuous: false });
    } catch {
      setListening(false);
      Alert.alert(t(lang, 'voiceUnavailable'), t(lang, 'voiceDeviceMessage'));
    }
  }

  function submit(): void {
    const value = name.trim();
    if (!value) { Alert.alert(t(lang, 'emptyName')); return; }
    if (value.length > 160) { Alert.alert(t(lang, 'itemTooLong')); return; }
    onSave(value);
  }

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 35 }} keyboardShouldPersistTaps="handled">
        <PageHeader title={t(lang, item ? 'editItem' : 'newItem')} lang={lang} onBack={onClose} />
        <View style={[S.card, S.shadow, { marginBottom: 20, padding: 20, paddingTop: 24 }]}>
          <View style={{ width: 61, height: 61, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: C.peach, marginBottom: 19, alignSelf: lang === 'ar' ? 'flex-end' : 'flex-start' }}>
            <Text style={{ fontSize: 32 }}>🧺</Text>
          </View>
          <Text style={[{ color: C.forestDeep, fontSize: 23, fontWeight: '800', marginBottom: 8 }, dirStyle(lang)]}>{t(lang, 'addHint')}</Text>
          <SectionLabel lang={lang}>{t(lang, 'itemName')}</SectionLabel>
          <TextInput value={name} onChangeText={setName} maxLength={165}
            placeholder={t(lang, 'typePlaceholder')} placeholderTextColor="#9A9E94"
            autoFocus returnKeyType="done" onSubmitEditing={submit} accessibilityLabel={t(lang, 'itemName')}
            style={[{ borderColor: C.border, borderWidth: 1.5, borderRadius: 16, backgroundColor: C.page, color: C.forestDeep, minHeight: 62, paddingHorizontal: 16, fontSize: 18, fontWeight: '600', marginBottom: 18 }, dirStyle(lang)]} />
          <View style={{ flexDirection: rowDirection(lang), alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
            <Text style={[{ color: C.muted, fontWeight: '700', fontSize: 14, flexShrink: 1 }, dirStyle(lang)]}>{t(lang, 'voice')}</Text>
            <View style={{ flexDirection: rowDirection(lang), gap: 8 }}>
              {(['ar-EG', 'en-US'] as RecognitionLanguage[]).map(locale => (
                <Pressable key={locale} onPress={() => setVoiceLocale(locale)} accessibilityRole="button"
                  accessibilityState={{ selected: locale === voiceLocale }}
                  style={{ backgroundColor: locale === voiceLocale ? C.mint : C.soft, borderRadius: 12, paddingHorizontal: 12, minHeight: 43, justifyContent: 'center' }}>
                  <Text style={{ color: locale === voiceLocale ? C.forest : C.muted, fontWeight: '800', fontSize: 13 }}>{locale === 'ar-EG' ? t(lang, 'voiceArabic') : t(lang, 'voiceEnglish')}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable onPress={() => void toggleSpeech()} accessibilityRole="button" accessibilityLabel={t(lang, listening ? 'voiceStop' : 'voice')}
            style={{ borderRadius: 18, backgroundColor: listening ? '#FCE9E2' : C.mint, minHeight: 62, flexDirection: rowDirection(lang), alignItems: 'center', justifyContent: 'center', gap: 12, padding: 10 }}>
            <Text style={{ fontSize: 23 }}>{listening ? '⏹' : '🎙️'}</Text>
            <Text style={{ color: listening ? C.coral : C.forest, fontSize: 16, fontWeight: '800' }}>{t(lang, listening ? 'voiceStop' : 'voice')} · {voiceLocaleText}</Text>
          </Pressable>
          {listening && <Text style={[{ fontSize: 13, color: C.coral, marginTop: 11, fontWeight: '700' }, dirStyle(lang)]}>● {t(lang, 'listening')}</Text>}
        </View>
        <PrimaryButton label={t(lang, item ? 'saveChanges' : 'saveItem')} onPress={submit} style={{ minHeight: 62 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
