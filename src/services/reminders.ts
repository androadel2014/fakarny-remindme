import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { remainingNames, type Language, type ShoppingState } from '../domain/shopping';
import { t } from '../i18n/strings';

export const REMINDER_CHANNEL = 'fakarny-shopping-v1';
const REMINDER_OWNER = 'fakarny-weekly-v1';

// Foreground delivery + chime + heads-up while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let scheduleQueue: Promise<void> = Promise.resolve();

export function buildNotificationContent(state: ShoppingState): Notifications.NotificationContentInput {
  const lang: Language = state.preferences.language;
  const names = remainingNames(state.items);
  // The body contains the ENTIRE list; do not truncate it here. Android may
  // shorten its lockscreen preview; the complete snapshot is in data.items.
  const body = names.length > 0
    ? `${t(lang, 'alarmBody')}\n${names.map((name, i) => `${i + 1}. ${name}`).join('\n')}`
    : t(lang, 'alarmEmpty');
  return {
    title: t(lang, 'alarmTitle'),
    body,
    sound: 'reminder.wav',
    priority: Notifications.AndroidNotificationPriority.MAX,
    interruptionLevel: 'timeSensitive',
    data: { owner: REMINDER_OWNER, items: names },
    ...(Platform.OS === 'android' ? { color: '#255F49' } : {}),
  };
}

export function isOurReminder(content: Notifications.NotificationContent): boolean {
  return content.data?.owner === REMINDER_OWNER;
}

export function snapshotFromReminder(content: Notifications.NotificationContent): string[] {
  const items = content.data?.items;
  return Array.isArray(items) ? items.filter((v): v is string => typeof v === 'string') : [];
}

export async function ensureReminderChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: 'Weekly shopping reminder',
    description: 'Weekly shopping list reminders with a short chime',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 150, 300],
    enableVibrate: true,
    sound: 'reminder.wav',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: false,
  });
}

export async function getReminderPermissions(): Promise<{ notifications: boolean; exact: boolean }> {
  const n = await Notifications.getPermissionsAsync();
  const notifications = n.granted || n.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (Platform.OS !== 'android') return { notifications, exact: true };
  const e = await Notifications.getExactAlarmPermissionsAsync();
  return { notifications, exact: e.granted };
}

export async function askNotificationPermission(): Promise<boolean> {
  await ensureReminderChannel();
  const current = await Notifications.getPermissionsAsync();
  if (!current.granted && !current.canAskAgain) {
    // Android/iOS cannot re-show a permission dialog after a hard denial.
    await Linking.openSettings();
    return false;
  }
  const result = current.granted ? current : await Notifications.requestPermissionsAsync();
  return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function askExactAlarmPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const result = await Notifications.requestExactAlarmPermissionsAsync();
  return result.granted;
}

async function replaceScheduledReminder(state: ShoppingState): Promise<void> {
  await ensureReminderChannel();
  // Find our notifications, even across a cold launch. Never touch other apps.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (isOurReminder(notification.content)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
  const permissions = await getReminderPermissions();
  if (!permissions.notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: buildNotificationContent(state),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: state.preferences.weekday,
      hour: state.preferences.hour,
      minute: state.preferences.minute,
      channelId: REMINDER_CHANNEL,
      // Exact-alarm special access is opt-in; best-effort remains functional.
      delivery: permissions.exact ? 'alarmClock' : 'bestEffort',
    },
  });
}

/** Serialized so rapid edits never leave an old reminder or duplicate alarm. */
export function synchronizeReminder(state: ShoppingState): Promise<void> {
  const job = scheduleQueue.catch(() => undefined).then(() => replaceScheduledReminder(state));
  scheduleQueue = job;
  return job;
}
