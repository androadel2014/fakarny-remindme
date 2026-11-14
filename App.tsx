import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  applyAutomaticCarryOver, createInitialState, finishShopping, updatePreferences,
  type Preferences, type ShoppingState,
} from './src/domain/shopping';
import { loadState, saveState } from './src/services/storage';
import {
  askExactAlarmPermission, askNotificationPermission, getReminderPermissions,
  isOurReminder, snapshotFromReminder, synchronizeReminder,
} from './src/services/reminders';
import { C, S, dirStyle, rowDirection } from './src/components/theme';
import { PrimaryButton } from './src/components/Ui';
import { t } from './src/i18n/strings';
import Home from './src/screens/Home';
import ItemEditor from './src/screens/ItemEditor';
import Settings from './src/screens/Settings';

type Screen = 'home' | 'edit' | 'settings';
type PermissionState = { notifications: boolean; exact: boolean };

function MainApp() {
  const [data, setData] = useState<ShoppingState>(() => createInitialState());
  const dataRef = useRef<ShoppingState>(data);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [errorBanner, setErrorBanner] = useState<'writeError' | 'notificationError' | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [permissions, setPermissions] = useState<PermissionState>({ notifications: false, exact: false });
  const [alarmItems, setAlarmItems] = useState<string[] | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const language = data.preferences.language;

  const changeData = useCallback((change: (prev: ShoppingState) => ShoppingState) => {
    setData(prev => {
      const next = change(prev);
      dataRef.current = next;
      return next;
    });
  }, []);

  const refreshPermissions = useCallback(async () => {
    try { setPermissions(await getReminderPermissions()); }
    catch { setPermissions({ notifications: false, exact: false }); }
  }, []);

  const hydrate = useCallback(async () => {
    setLoadError(false);
    try {
      const stored = applyAutomaticCarryOver(await loadState(), new Date());
      dataRef.current = stored;
      setData(stored);
      setReady(true);
    } catch {
      // Never overwrite malformed/unreadable user data with an empty default.
      setLoadError(true);
    }
  }, []);

  useEffect(() => { void hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!ready) return;
    // Only one AsyncStorage write at a time; edits cannot race one another.
    const job = saveQueue.current.catch(() => undefined).then(() => saveState(data));
    saveQueue.current = job;
    void job.catch(() => setErrorBanner('writeError'));
    void synchronizeReminder(data).catch(() => setErrorBanner('notificationError'));
  }, [data, ready]);

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      await refreshPermissions();
      try { await askNotificationPermission(); } catch { /* User may decline. */ }
      await refreshPermissions();
      void synchronizeReminder(dataRef.current).catch(() => setErrorBanner('notificationError'));
    })();
  }, [ready, refreshPermissions]);

  useEffect(() => {
    if (!ready) return;
    function refreshAfterResume() {
      const date = new Date();
      setNow(date);
      changeData(prev => applyAutomaticCarryOver(prev, date));
      void refreshPermissions();
      void synchronizeReminder(dataRef.current).catch(() => setErrorBanner('notificationError'));
    }
    const timer = setInterval(() => {
      const date = new Date();
      setNow(date);
      changeData(prev => applyAutomaticCarryOver(prev, date));
    }, 30000);
    const lifecycle = AppState.addEventListener('change', state => {
      if (state === 'active') refreshAfterResume();
    });
    return () => { clearInterval(timer); lifecycle.remove(); };
  }, [ready, refreshPermissions, changeData]);

  useEffect(() => {
    if (!ready) return;
    const displayReminder = (notification: Notifications.Notification) => {
      if (!isOurReminder(notification.request.content)) return;
      setAlarmItems(snapshotFromReminder(notification.request.content));
    };
    const received = Notifications.addNotificationReceivedListener(displayReminder);
    const responded = Notifications.addNotificationResponseReceivedListener(response => {
      displayReminder(response.notification);
      setScreen('home');
    });
    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        displayReminder(response.notification);
        setScreen('home');
        void Notifications.clearLastNotificationResponseAsync();
      }
    }).catch(() => undefined);
    return () => { received.remove(); responded.remove(); };
  }, [ready]);

  function saveItem(name: string) {
    const date = new Date().toISOString();
    changeData(prev => editingId
      ? ({ ...prev, items: prev.items.map(item => item.id === editingId ? { ...item, name, updatedAt: date } : item) })
      : ({ ...prev, items: [{ id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`, name, checked: false, createdAt: date, updatedAt: date }, ...prev.items] }));
    setEditingId(null);
    setScreen('home');
  }

  function savePreferences(preferences: Preferences) {
    changeData(prev => updatePreferences(prev, preferences, new Date()));
    setScreen('home');
  }

  async function requestNotifications() {
    try {
      await askNotificationPermission();
      await refreshPermissions();
      await synchronizeReminder(dataRef.current);
    } catch { setErrorBanner('notificationError'); }
  }
  async function requestExact() {
    try {
      await askExactAlarmPermission();
      await refreshPermissions();
      await synchronizeReminder(dataRef.current);
    } catch { setErrorBanner('notificationError'); }
  }

  const listHeading = t(language, 'alarmTitle');
  return (
    <SafeAreaView style={S.screen} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      {!ready ? (
        <View style={{ flex: 1, padding: 25, justifyContent: 'center', alignItems: 'center', gap: 19 }}>
          {loadError ? (
            <>
              <Text style={{ color: C.coral, textAlign: 'center', fontSize: 17 }}>{t(language, 'storageError')}</Text>
              <PrimaryButton label={t(language, 'retry')} onPress={() => void hydrate()} />
            </>
          ) : <ActivityIndicator color={C.forest} size="large" />}
        </View>
      ) : (
        <>
          {screen === 'home' && <Home state={data} now={now} onSettings={() => { void refreshPermissions(); setScreen('settings'); }}
            onAdd={() => { setEditingId(null); setScreen('edit'); }}
            onToggle={id => changeData(prev => ({ ...prev, items: prev.items.map(item => item.id === id ? { ...item, checked: !item.checked, updatedAt: new Date().toISOString() } : item) }))}
            onEdit={id => { setEditingId(id); setScreen('edit'); }}
            onDelete={id => changeData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }))}
            onFinish={() => changeData(prev => finishShopping(prev, new Date()))} />}
          {screen === 'edit' && <ItemEditor key={editingId ?? 'new'} lang={language} item={data.items.find(item => item.id === editingId)}
            onClose={() => { setEditingId(null); setScreen('home'); }} onSave={saveItem} />}
          {screen === 'settings' && <Settings preferences={data.preferences} notificationAllowed={permissions.notifications} exactAllowed={permissions.exact}
            onClose={() => setScreen('home')} onSave={savePreferences}
            onNotificationPermission={() => void requestNotifications()} onExactPermission={() => void requestExact()} />}
        </>
      )}
      {errorBanner && ready && (
        <Pressable onPress={() => { setErrorBanner(null); void synchronizeReminder(dataRef.current).catch(() => setErrorBanner('notificationError')); }}
          accessibilityRole="button" style={{ position: 'absolute', top: 10, left: 15, right: 15, backgroundColor: C.peach, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.apricot }}>
          <Text style={{ color: C.forestDeep, fontWeight: '700', textAlign: 'center' }}>{t(language, errorBanner)}  ↻</Text>
        </Pressable>
      )}
      <Modal visible={alarmItems !== null} transparent animationType="fade" onRequestClose={() => setAlarmItems(null)}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: C.overlay }}>
          <View style={{ backgroundColor: C.paper, borderRadius: 28, padding: 23, maxHeight: '82%' }}>
            <Text style={{ fontSize: 45, textAlign: 'center', marginBottom: 10 }}>🛒</Text>
            <Text style={{ fontSize: 23, color: C.forestDeep, fontWeight: '900', textAlign: 'center' }}>{listHeading}</Text>
            <Text style={{ fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 7, marginBottom: 19 }}>{t(language, 'alarmBody')}</Text>
            <ScrollView style={{ flexGrow: 0, marginBottom: 18 }}>
              {alarmItems && alarmItems.length > 0 ? alarmItems.map((name, i) => (
                <View key={`${i}-${name}`} style={{ flexDirection: rowDirection(language), backgroundColor: C.soft, borderRadius: 14, padding: 12, marginBottom: 8, gap: 11, alignItems: 'center' }}>
                  <Text style={{ color: C.forest, fontWeight: '800' }}>{i + 1}.</Text>
                  <Text style={[{ flex: 1, color: C.text, fontWeight: '700', fontSize: 17 }, dirStyle(language)]}>{name}</Text>
                </View>
              )) : <Text style={[S.muted, { textAlign: 'center', padding: 12 }]}>{t(language, 'alarmEmpty')}</Text>}
            </ScrollView>
            <PrimaryButton label={t(language, 'openList')} onPress={() => { setAlarmItems(null); setScreen('home'); }} />
            <Pressable onPress={() => setAlarmItems(null)} accessibilityRole="button" style={{ alignItems: 'center', minHeight: 46, justifyContent: 'center', marginTop: 6 }}>
              <Text style={{ color: C.forest, fontWeight: '700' }}>{t(language, 'dismiss')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider><MainApp /></SafeAreaProvider>;
}
