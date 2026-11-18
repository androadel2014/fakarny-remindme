import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, Modal, Platform, Pressable, ScrollView, Share, Text, View, useColorScheme } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  applyAutomaticCarryOverToLists,
  createShoppingList,
  DEFAULT_LIST_SCHEDULE,
  finishShoppingList,
  makeItem,
  updateListSchedule,
  type AppState as ShoppingAppState,
  type Language,
  type ListSchedule,
} from './src/domain/shopping';
import { getListDisplayName, getTemplate, type TemplateKind } from './src/domain/templates';
import { resolveHardwareBack, type AppScreen } from './src/domain/navigation';
import { buildSharedListMessage } from './src/domain/share';
import { loadState, saveState } from './src/services/storage';
import {
  askExactAlarmPermission, askNotificationPermission, getReminderPermissions,
  isOurReminder, snapshotFromReminder, synchronizeReminders, type AlarmSnapshot,
} from './src/services/reminders';
import { initializeAds, showInterstitialAfterFinish } from './src/services/ads';
import { C, S, dirStyle, rowDirection, setActiveTheme } from './src/components/theme';
import { PrimaryButton, SecondaryButton } from './src/components/Ui';
import { formatNumber, t } from './src/i18n/strings';
import Home from './src/screens/Home';
import ListDetail from './src/screens/ListDetail';
import ListEditor from './src/screens/ListEditor';
import ItemEditor from './src/screens/ItemEditor';
import Settings from './src/screens/Settings';
import Intro from './src/screens/Intro';

type Screen = AppScreen;
type PermissionState = { notifications: boolean };

function MainApp() {
  const [data, setData] = useState<ShoppingAppState>(() => ({ schemaVersion: 3, lists: [], preferences: { language: 'ar', themeMode: 'system' }, hasSeenIntro: false }));
  const dataRef = useRef<ShoppingAppState>(data);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [errorBanner, setErrorBanner] = useState<'writeError' | 'notificationError' | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionState>({ notifications: false });
  const [alarmSnapshot, setAlarmSnapshot] = useState<AlarmSnapshot | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const language = data.preferences.language;
  const themeMode = data.preferences.themeMode ?? 'system';
  const systemColorScheme = useColorScheme();
  const resolvedTheme = themeMode === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : themeMode;
  setActiveTheme(resolvedTheme);
  const selectedList = data.lists.find(list => list.id === selectedListId);

  const commit = useCallback((next: ShoppingAppState) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const refreshPermissions = useCallback(async () => {
    try { setPermissions(await getReminderPermissions()); }
    catch { setPermissions({ notifications: false }); }
  }, []);

  const hydrate = useCallback(async () => {
    setLoadError(false);
    try {
      const stored = applyAutomaticCarryOverToLists(await loadState(), new Date());
      dataRef.current = stored;
      setData(stored);
      setReady(true);
    } catch {
      // Never replace unreadable saved data with an empty default.
      setLoadError(true);
    }
  }, []);

  useEffect(() => { void hydrate(); }, [hydrate]);

  // Android's hardware Back button follows the same in-app navigation as the
  // visible Back controls instead of closing the app from nested screens.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (alarmSnapshot) {
        setAlarmSnapshot(null);
        return true;
      }
      if (!ready || !data.hasSeenIntro) return false;
      const hasSelectedList = !!selectedListId && dataRef.current.lists.some(list => list.id === selectedListId);
      const destination = resolveHardwareBack(screen, hasSelectedList);
      if (destination === 'exit') return false;
      if (screen === 'itemEditor') setEditingItemId(null);
      if (screen === 'listEditor') setEditingListId(null);
      if (destination === 'home') setSelectedListId(null);
      setScreen(destination);
      return true;
    });
    return () => subscription.remove();
  }, [alarmSnapshot, ready, data.hasSeenIntro, screen, selectedListId]);

  useEffect(() => {
    if (!ready) return;
    const job = saveQueue.current.catch(() => undefined).then(() => saveState(data));
    saveQueue.current = job;
    void job.catch(() => setErrorBanner('writeError'));
    void synchronizeReminders(data).catch(() => setErrorBanner('notificationError'));
  }, [data, ready]);

  useEffect(() => {
    if (!ready) return;
    void initializeAds();
    if (!data.hasSeenIntro) return;
    void (async () => {
      await refreshPermissions();
      void synchronizeReminders(dataRef.current).catch(() => setErrorBanner('notificationError'));
    })();
  }, [ready, data.hasSeenIntro, language, refreshPermissions]);

  useEffect(() => {
    if (!ready) return;
    const reconcile = () => {
      const date = new Date();
      const next = applyAutomaticCarryOverToLists(dataRef.current, date);
      if (next !== dataRef.current) commit(next);
      void refreshPermissions();
      void synchronizeReminders(next).catch(() => setErrorBanner('notificationError'));
    };
    const timer = setInterval(() => {
      const date = new Date();
      const next = applyAutomaticCarryOverToLists(dataRef.current, date);
      if (next !== dataRef.current) commit(next);
    }, 30000);
    const lifecycle = AppState.addEventListener('change', state => {
      if (state === 'active') reconcile();
    });
    return () => { clearInterval(timer); lifecycle.remove(); };
  }, [ready, commit, refreshPermissions]);

  useEffect(() => {
    if (!ready) return;
    const handleNotification = (notification: Notifications.Notification) => {
      if (!isOurReminder(notification.request.content)) return;
      const snapshot = snapshotFromReminder(notification.request.content);
      setAlarmSnapshot(snapshot);
      setSelectedListId(snapshot.listId);
      setScreen('list');
    };
    const received = Notifications.addNotificationReceivedListener(handleNotification);
    const responded = Notifications.addNotificationResponseReceivedListener(response => handleNotification(response.notification));
    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        handleNotification(response.notification);
        void Notifications.clearLastNotificationResponseAsync();
      }
    }).catch(() => undefined);
    return () => { received.remove(); responded.remove(); };
  }, [ready]);

  async function handleIntroContinue() {
    commit({ ...dataRef.current, hasSeenIntro: true });
    try {
      await askNotificationPermission(language);
      await askExactAlarmPermission();
      await refreshPermissions();
      await synchronizeReminders(dataRef.current);
      setErrorBanner(null);
    } catch {
      setErrorBanner('notificationError');
    }
  }

  async function requestNotifications() {
    try {
      await askNotificationPermission(language);
      await refreshPermissions();
      await synchronizeReminders(dataRef.current);
      setErrorBanner(null);
    } catch { setErrorBanner('notificationError'); }
  }

  async function requestExact() {
    try {
      await askExactAlarmPermission();
      await refreshPermissions();
      await synchronizeReminders(dataRef.current);
      setErrorBanner(null);
    } catch { setErrorBanner('notificationError'); }
  }

  function openNewList() {
    setSelectedListId(null);
    setEditingListId(null);
    setScreen('listEditor');
  }

  function openListEditor(id: string) {
    setSelectedListId(id);
    setEditingListId(id);
    setScreen('listEditor');
  }

  function saveList(name: string, schedule: ListSchedule) {
    const current = dataRef.current;
    if (editingListId) {
      const updated = current.lists.map(list => list.id === editingListId
        ? updateListSchedule({ ...list, name, localizedNames: { ...list.localizedNames, [language]: name } }, schedule, new Date())
        : list);
      commit({ ...current, lists: updated });
      setSelectedListId(editingListId);
      setScreen('list');
    } else {
      const created = createShoppingList(name, [], schedule, new Date(), undefined, { [language]: name });
      commit({ ...current, lists: [...current.lists, created] });
      setSelectedListId(created.id);
      setScreen('list');
    }
    setEditingListId(null);
  }

  function createFromTemplate(kind: TemplateKind) {
    const template = getTemplate(kind, language);
    const templateSchedule: ListSchedule = kind === 'monthly'
      ? { ...DEFAULT_LIST_SCHEDULE, cadence: 'monthly', weekdays: [], dayOfMonth: 1 }
      : DEFAULT_LIST_SCHEDULE;
    const created = createShoppingList(template.name, template.items, templateSchedule, new Date(), undefined, template.localizedNames);
    commit({ ...dataRef.current, lists: [...dataRef.current.lists, created] });
    setSelectedListId(created.id);
    setScreen('list');
  }

  function openItemEditor(id?: string) {
    setEditingItemId(id ?? null);
    setScreen('itemEditor');
  }

  function saveItem(name: string) {
    if (!selectedListId) return;
    const current = dataRef.current;
    const list = current.lists.find(value => value.id === selectedListId);
    if (!list) return;
    const timestamp = new Date().toISOString();
    const items = editingItemId
      ? list.items.map(item => item.id === editingItemId ? { ...item, name, updatedAt: timestamp } : item)
      : [makeItem(name), ...list.items];
    commit({ ...current, lists: current.lists.map(value => value.id === list.id ? { ...value, items } : value) });
    setEditingItemId(null);
    setScreen('list');
  }

  function toggleItem(id: string) {
    if (!selectedListId) return;
    const current = dataRef.current;
    const timestamp = new Date().toISOString();
    const lists = current.lists.map(list => list.id === selectedListId ? {
      ...list,
      items: list.items.map(item => item.id === id ? { ...item, checked: !item.checked, updatedAt: timestamp } : item),
    } : list);
    commit({ ...current, lists });
  }

  function deleteItem(id: string) {
    if (!selectedListId) return;
    const current = dataRef.current;
    const lists = current.lists.map(list => list.id === selectedListId
      ? { ...list, items: list.items.filter(item => item.id !== id) }
      : list);
    commit({ ...current, lists });
  }

  function finishList() {
    if (!selectedListId) return;
    const current = dataRef.current;
    const list = current.lists.find(value => value.id === selectedListId);
    const completed = list?.items.some(item => item.checked) ?? false;
    const next = finishShoppingList(current, selectedListId, new Date());
    commit(next);
    if (completed) void showInterstitialAfterFinish();
  }

  function deleteList() {
    if (!selectedListId) return;
    const next = { ...dataRef.current, lists: dataRef.current.lists.filter(list => list.id !== selectedListId) };
    commit(next);
    setSelectedListId(null);
    setScreen('home');
  }

  async function shareList() {
    if (!selectedList) return;
    const shared = buildSharedListMessage(selectedList, language);
    try { await Share.share(shared); }
    catch { Alert.alert(t(language, 'shareError')); }
  }

  function savePreferences(nextLanguage: Language, nextThemeMode: 'system' | 'light' | 'dark') {
    commit({ ...dataRef.current, preferences: { ...dataRef.current.preferences, language: nextLanguage, themeMode: nextThemeMode } });
    setScreen('home');
  }

  const alarmList = data.lists.find(list => list.id === alarmSnapshot?.listId);
  const alarmTitle = alarmList ? getListDisplayName(alarmList, language) : (alarmSnapshot?.listName || t(language, 'appName'));

  return (
    <SafeAreaView style={S.screen} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      {!ready ? (
        <View style={{ flex: 1, padding: 25, justifyContent: 'center', alignItems: 'center', gap: 18 }}>
          {loadError ? (
            <>
              <Text style={{ color: C.coral, textAlign: 'center', fontSize: 16 }}>{t(language, 'storageError')}</Text>
              <PrimaryButton label={t(language, 'retry')} onPress={() => void hydrate()} />
            </>
          ) : <ActivityIndicator color={C.forest} size="large" />}
        </View>
      ) : !data.hasSeenIntro ? (
        <Intro lang={language} onContinue={() => void handleIntroContinue()} />
      ) : (
        <>
          {screen === 'home' && <Home state={data}
            onOpenList={id => { setSelectedListId(id); setScreen('list'); }}
            onCreateList={openNewList}
            onCreateTemplate={createFromTemplate}
            onSettings={() => { void refreshPermissions(); setScreen('settings'); }}
            onEditList={openListEditor} />}

          {screen === 'list' && selectedList && <ListDetail list={selectedList} lang={language}
            onBack={() => { setSelectedListId(null); setScreen('home'); }}
            onEditList={() => openListEditor(selectedList.id)}
            onAddItem={() => openItemEditor()}
            onToggle={toggleItem}
            onEditItem={id => openItemEditor(id)}
            onDeleteItem={deleteItem}
            onFinish={finishList}
            onShare={() => void shareList()}
            onDeleteList={deleteList} />}

          {screen === 'listEditor' && <ListEditor key={editingListId ?? 'new-list'} lang={language}
            list={data.lists.find(list => list.id === editingListId)}
            onClose={() => { setEditingListId(null); setScreen(selectedList ? 'list' : 'home'); }}
            onSave={saveList} />}

          {screen === 'itemEditor' && selectedList && <ItemEditor key={editingItemId ?? `new-${selectedList.id}`} lang={language}
            item={selectedList.items.find(item => item.id === editingItemId)}
            onClose={() => { setEditingItemId(null); setScreen('list'); }}
            onSave={saveItem} />}

          {screen === 'settings' && <Settings language={language} themeMode={themeMode} notificationAllowed={permissions.notifications}
            onClose={() => setScreen('home')} onSave={savePreferences}
            onNotificationPermission={() => void requestNotifications()} onExactPermission={() => void requestExact()} />}
        </>
      )}

      {errorBanner && ready && (
        <Pressable onPress={() => { setErrorBanner(null); void synchronizeReminders(dataRef.current).catch(() => setErrorBanner('notificationError')); }}
          accessibilityRole="button" accessibilityLabel={t(language, errorBanner)}
          style={{ position: 'absolute', top: 9, left: 14, right: 14, backgroundColor: C.peach, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: C.apricot }}>
          <Text style={{ color: C.forestDeep, fontWeight: '800', textAlign: 'center' }}>{t(language, errorBanner)}  ↻</Text>
        </Pressable>
      )}

      <Modal visible={alarmSnapshot !== null} transparent animationType="fade" onRequestClose={() => setAlarmSnapshot(null)}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 22, backgroundColor: C.overlay }}>
          <View style={{ backgroundColor: C.paper, borderRadius: 26, padding: 22, maxHeight: '82%' }}>
            <Text style={{ fontSize: 42, textAlign: 'center', marginBottom: 10 }}>🛒</Text>
            <Text style={{ fontSize: 22, color: C.forestDeep, fontWeight: '900', textAlign: 'center' }}>{alarmTitle}</Text>
            <Text style={[{ fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 7, marginBottom: 16 }, dirStyle(language)]}>{t(language, 'alarmBody')}</Text>
            <ScrollView style={{ flexGrow: 0, marginBottom: 16 }}>
              {alarmSnapshot && alarmSnapshot.items.length > 0 ? alarmSnapshot.items.map((name, index) => (
                <View key={`${index}-${name}`} style={{ flexDirection: rowDirection(language), backgroundColor: C.soft, borderRadius: 13, padding: 11, marginBottom: 8, gap: 10, alignItems: 'center' }}>
                  <Text style={{ color: C.forest, fontWeight: '900' }}>{formatNumber(index + 1, language)}.</Text>
                  <Text style={[{ flex: 1, color: C.text, fontWeight: '700', fontSize: 16 }, dirStyle(language)]}>{name}</Text>
                </View>
              )) : <Text style={[S.muted, { textAlign: 'center', padding: 12 }]}>{t(language, 'alarmEmpty')}</Text>}
            </ScrollView>
            <PrimaryButton label={t(language, 'openList')} onPress={() => {
              const targetId = alarmSnapshot?.listId;
              setAlarmSnapshot(null);
              if (targetId && dataRef.current.lists.some(list => list.id === targetId)) {
                setSelectedListId(targetId);
                setScreen('list');
              } else setScreen('home');
            }} />
            <SecondaryButton label={t(language, 'dismiss')} onPress={() => setAlarmSnapshot(null)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider><MainApp /></SafeAreaProvider>;
}
