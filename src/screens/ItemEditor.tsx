import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import type { Language, RecognitionLanguage, ShoppingItem } from '../domain/shopping';
import { t } from '../i18n/strings';
import { C, S, dirStyle, rowDirection } from '../components/theme';
import { PageHeader, PrimaryButton, SecondaryButton, SectionLabel } from '../components/Ui';

interface Props {
  lang: Language;
  item?: ShoppingItem;
  onClose: () => void;
  onSave: (name: string) => void;
}

type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function getSpeechModule(): SpeechModule | null {
  if (isExpoGo()) return null;
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
  const [showMicExplanation, setShowMicExplanation] = useState(false);
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
      const transcript = event.results?.[0]?.transcript?.trim();
      if (transcript) setName(baseText.current ? `${baseText.current} ${transcript}` : transcript);
    });
    const error = module.addListener('error', event => {
      setListening(false);
      if (event.error === 'not-allowed') {
        Alert.alert(t(lang, 'voiceUnavailable'), t(lang, 'voicePermissionDenied'));
      } else {
        Alert.alert(t(lang, 'voiceUnavailable'), t(lang, 'listeningError'));
      }
    });
    return () => {
      start.remove(); end.remove(); result.remove(); error.remove();
      try { module.abort(); } catch { /* Recognition may already be stopped. */ }
    };
  }, [lang]);

  function startRecognition() {
    const module = speech.current;
    if (!module) return;
    baseText.current = name.trim();
    try {
      module.start({ lang: voiceLocale, interimResults: true, continuous: false, maxAlternatives: 1 });
    } catch {
      setListening(false);
      Alert.alert(t(lang, 'voiceUnavailable'), t(lang, 'voiceDeviceMessage'));
    }
  }

  async function requestMicAndStart() {
    setShowMicExplanation(false);
    const module = speech.current;
    if (!module) return;
    try {
      const result = await module.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert(t(lang, 'voiceUnavailable'), t(lang, 'voicePermissionDenied'));
        return;
      }
      startRecognition();
    } catch {
      Alert.alert(t(lang, 'voiceUnavailable'), t(lang, 'voiceDeviceMessage'));
    }
  }

  async function toggleSpeech() {
    const module = speech.current;
    if (!module) {
      Alert.alert(t(lang, 'voiceUnavailable'), isExpoGo() ? t(lang, 'voiceDevBuildMessage') : t(lang, 'voiceDeviceMessage'));
      return;
    }
    if (listening) {
      try { module.stop(); } catch { setListening(false); }
      return;
    }
    try {
      const current = await module.getPermissionsAsync();
      if (current.granted) startRecognition();
      else setShowMicExplanation(true);
    } catch {
      setShowMicExplanation(true);
    }
  }

  function submit() {
    const value = name.trim();
    if (!value) { Alert.alert(t(lang, 'emptyItemName')); return; }
    if (value.length > 160) { Alert.alert(t(lang, 'itemTooLong')); return; }
    onSave(value);
  }

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 35 }} keyboardShouldPersistTaps="handled">
        <PageHeader title={t(lang, item ? 'editItem' : 'newItem')} lang={lang} onBack={onClose} />
        <View style={[S.card, S.shadow, { marginBottom: 18, padding: 20, paddingTop: 23 }]}>
          <View style={{ width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: C.peach, marginBottom: 16, alignSelf: lang === 'ar' ? 'flex-end' : 'flex-start' }}>
            <Text style={{ fontSize: 30 }}>🧺</Text>
          </View>
          <Text style={[{ color: C.forestDeep, fontSize: 21, fontWeight: '900', marginBottom: 8 }, dirStyle(lang)]}>{t(lang, 'itemHint')}</Text>
          <SectionLabel lang={lang}>{t(lang, 'itemName')}</SectionLabel>
          <TextInput value={name} onChangeText={setName} maxLength={160}
            placeholder={t(lang, 'itemPlaceholder')} placeholderTextColor={C.placeholder}
            autoFocus returnKeyType="done" onSubmitEditing={submit} accessibilityLabel={t(lang, 'itemName')}
            style={[S.input, { marginBottom: 18 }, dirStyle(lang)]} />
          <View style={{ flexDirection: rowDirection(lang), alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 11 }}>
            <Text style={[{ color: C.muted, fontWeight: '800', fontSize: 14, flexShrink: 1 }, dirStyle(lang)]}>{t(lang, 'voice')}</Text>
            <View style={{ flexDirection: rowDirection(lang), gap: 7 }}>
              {(['ar-EG', 'en-US'] as RecognitionLanguage[]).map(locale => (
                <Pressable key={locale} onPress={() => setVoiceLocale(locale)} accessibilityRole="button"
                  accessibilityState={{ selected: locale === voiceLocale }} disabled={listening}
                  style={{ backgroundColor: locale === voiceLocale ? C.mint : C.soft, borderRadius: 12, paddingHorizontal: 11, minHeight: 41, justifyContent: 'center', opacity: listening ? .55 : 1 }}>
                  <Text style={{ color: locale === voiceLocale ? C.forest : C.muted, fontWeight: '800', fontSize: 13 }}>{locale === 'ar-EG' ? t(lang, 'voiceArabic') : t(lang, 'voiceEnglish')}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable onPress={() => void toggleSpeech()} accessibilityRole="button" accessibilityLabel={t(lang, listening ? 'voiceStop' : 'voice')}
            style={{ borderRadius: 17, backgroundColor: listening ? C.dangerBg : C.mint, minHeight: 59, flexDirection: rowDirection(lang), alignItems: 'center', justifyContent: 'center', gap: 11, padding: 10 }}>
            <Text style={{ fontSize: 21 }}>{listening ? '⏹' : '🎙️'}</Text>
            <Text style={{ color: listening ? C.coral : C.forest, fontSize: 15, fontWeight: '900' }}>{t(lang, listening ? 'voiceStop' : 'voice')} · {voiceLocaleText}</Text>
          </Pressable>
          {listening && <Text style={[{ fontSize: 13, color: C.coral, marginTop: 10, fontWeight: '800' }, dirStyle(lang)]}>● {t(lang, 'listening')}</Text>}
        </View>
        <PrimaryButton label={t(lang, item ? 'saveChanges' : 'saveItem')} onPress={submit} style={{ minHeight: 60 }} />
      </ScrollView>

      <Modal visible={showMicExplanation} transparent animationType="fade" onRequestClose={() => setShowMicExplanation(false)}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 22, backgroundColor: C.overlay }}>
          <View style={[S.card, { padding: 22, borderRadius: 25 }]}>
            <Text style={{ fontSize: 38, textAlign: 'center', marginBottom: 12 }}>🎙️</Text>
            <Text style={[{ color: C.forestDeep, fontSize: 21, fontWeight: '900', marginBottom: 10 }, dirStyle(lang)]}>{t(lang, 'voicePermissionTitle')}</Text>
            <Text style={[S.muted, { marginBottom: 20 }, dirStyle(lang)]}>{t(lang, 'voicePermissionBody')}</Text>
            <PrimaryButton label={t(lang, 'voicePermissionContinue')} onPress={() => void requestMicAndStart()} />
            <SecondaryButton label={t(lang, 'voicePermissionLater')} onPress={() => setShowMicExplanation(false)} style={{ marginTop: 9 }} />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
