import { Linking, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Notifications from 'expo-notifications';
import { buildReminderSchedulePlan, type AppState, type Language, type ShoppingList, type Weekday } from '../domain/shopping';
import { formatNumber, t } from '../i18n/strings';

export const REMINDER_CHANNEL = 'fakarny-store-reminders-v2';
function reminderChannelId(language: Language): string { return `${REMINDER_CHANNEL}-${language}`; }
const REMINDER_OWNER = 'fakarny-store-reminder-v2';
const LEGACY_REMINDER_OWNER = 'fakarny-weekly-v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface AlarmSnapshot {
  listId: string;
  listName: string;
  items: string[];
}

export function buildNotificationContent(list: ShoppingList, language: Language): Notifications.NotificationContentInput {
  const outstanding = list.items.filter(item => !item.checked).map(item => item.name);
  const body = outstanding.length > 0
    ? `${t(language, 'alarmBody')}\n${outstanding.map((name, index) => `${formatNumber(index + 1, language)}. ${name}`).join('\n')}`
    : t(language, 'alarmEmpty');
  return {
    title: `${t(language, 'alarmTitlePrefix')} ${list.name}`,
    body,
    sound: 'reminder.wav',
    priority: Notifications.AndroidNotificationPriority.MAX,
    data: { owner: REMINDER_OWNER, listId: list.id, listName: list.name, items: outstanding },
    ...(Platform.OS === 'android' ? { color: '#245D48' } : {}),
  };
}

export function isOurReminder(content: Notifications.NotificationContent): boolean {
  return content.data?.owner === REMINDER_OWNER || content.data?.owner === LEGACY_REMINDER_OWNER;
}

export function snapshotFromReminder(content: Notifications.NotificationContent): AlarmSnapshot {
  const data = content.data ?? {};
  const items = data.items;
  return {
    listId: typeof data.listId === 'string' ? data.listId : 'migrated-v1-home-list',
    listName: typeof data.listName === 'string' ? data.listName : '',
    items: Array.isArray(items) ? items.filter((value): value is string => typeof value === 'string') : [],
  };
}

export async function ensureReminderChannel(language: Language): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(reminderChannelId(language), {
    name: t(language, 'notificationChannelName'),
    description: t(language, 'notificationChannelDescription'),
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 150, 300],
    enableVibrate: true,
    sound: 'reminder.wav',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: false,
  });
}

export async function getReminderPermissions(): Promise<{ notifications: boolean }> {
  const notificationStatus = await Notifications.getPermissionsAsync();
  const notifications = notificationStatus.granted
    || notificationStatus.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  return { notifications };
}

export async function askNotificationPermission(language: Language): Promise<boolean> {
  await ensureReminderChannel(language);
  const current = await Notifications.getPermissionsAsync();
  if (!current.granted && !current.canAskAgain) {
    await Linking.openSettings();
    return false;
  }
  const result = current.granted ? current : await Notifications.requestPermissionsAsync();
  return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function askExactAlarmPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 31) return;
  // SDK 54's expo-notifications supports SCHEDULE_EXACT_ALARM in the manifest,
  // but its JS API predates get/requestExactAlarmPermissionsAsync. Open the
  // Android special-access page directly instead of calling SDK 58-only APIs.
  try {
    await IntentLauncher.startActivityAsync('android.settings.REQUEST_SCHEDULE_EXACT_ALARM', {
      data: 'package:com.andrewmetry.fakarny',
    });
  } catch {
    await Linking.openSettings();
  }
}

let scheduleQueue: Promise<void> = Promise.resolve();

async function replaceScheduledReminders(state: AppState): Promise<void> {
  await ensureReminderChannel(state.preferences.language);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (isOurReminder(notification.content)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  const permissions = await getReminderPermissions();
  if (!permissions.notifications) return;

  const byId = new Map(state.lists.map(list => [list.id, list]));
  const plan = buildReminderSchedulePlan(state.lists);
  for (const entry of plan) {
    const list = byId.get(entry.listId);
    if (!list) continue;
    await Notifications.scheduleNotificationAsync({
      content: buildNotificationContent(list, state.preferences.language),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: entry.weekday as Weekday,
        hour: entry.hour,
        minute: entry.minute,
        channelId: reminderChannelId(state.preferences.language),
      },
    });
  }
}

/** Serialized rescheduling prevents rapid edits from leaving duplicate alarms. */
export function synchronizeReminders(state: AppState): Promise<void> {
  const job = scheduleQueue.catch(() => undefined).then(() => replaceScheduledReminders(state));
  scheduleQueue = job;
  return job;
}
