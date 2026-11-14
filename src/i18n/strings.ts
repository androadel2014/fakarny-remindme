import type { Language, Weekday } from '../domain/shopping';

export const STRINGS = {
  ar: {
    appName: 'فكّرني', tagLine: 'كل اللي ناقص البيت… في مكان واحد',
    hello: 'قائمة البيت', listLabel: 'قائمة الأسبوع', shoppingToday: 'يوم الشراء',
    nextShop: 'ميعاد الشراء الجاي', remaining: 'ناقص', bought: 'اتشرى', items: 'حاجة',
    days: 'يوم', hours: 'ساعة', minutes: 'دقيقة',
    settings: 'الإعدادات', newItem: 'ضيف حاجة', editItem: 'تعديل الحاجة',
    addHint: 'اكتب الحاجة اللي ناقصة من البيت', itemName: 'اسم الحاجة',
    typePlaceholder: 'مثلاً: بيض، لبن، عيش...', saveItem: 'ضيف للقائمة', saveChanges: 'احفظ التعديل',
    voice: 'قولها بصوتك', voiceStop: 'إيقاف التسجيل', listening: 'سامعك… اتكلم دلوقتي',
    voiceArabic: 'عربي', voiceEnglish: 'English', voiceUnavailable: 'الإملاء الصوتي مش متاح',
    voiceGoMessage: 'التسجيل الصوتي محتاج نسخة التطبيق المثبّتة (APK أو Development Build). الكتابة شغالة هنا.',
    voiceDeviceMessage: 'تأكد إن خدمة التعرّف على الكلام متاحة على جهازك وإن الميكروفون مسموح.',
    voicePermission: 'اسمح باستخدام الميكروفون والتعرّف على الكلام من إعدادات الجهاز.',
    noItemsTitle: 'البيت تمام؟ 🧺', noItemsBody: 'أول ما حاجة تخلص، ضيفها هنا. هتفكّرك بيها في يوم الشراء.',
    allDoneTitle: 'كل حاجة اتجابت! ✨', allDoneBody: 'اضغط «خلصت شراء» عشان نبدأ قائمة جديدة.',
    finish: 'خلصت شراء', finishConfirmTitle: 'خلصت شراء؟',
    finishConfirmBody: 'الحاجات اللي اشتريتها هتتمسح، واللي لسه ناقص هيفضل للأسبوع الجاي.',
    finishNow: 'أيوه، خلصت', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل',
    deleteConfirmTitle: 'تحذف الحاجة؟', deleteConfirmBody: 'مش هتظهر في قائمة الأسبوع.',
    settingsTitle: 'ظبط فكّرني', shoppingDay: 'يوم الشراء كل أسبوع', alarmTime: 'وقت التذكير',
    timeHours: 'الساعة', timeMinutes: 'الدقيقة', language: 'لغة التطبيق', arabic: 'العربية', english: 'English',
    notifications: 'تنبيهات الموبايل', notificationsEnabled: 'الإشعارات مفعّلة',
    notificationsOff: 'الإشعارات مقفولة — فعّلها عشان يصلك التذكير.',
    notificationsButton: 'اسمح بالإشعارات', exactOn: 'التذكير الدقيق مفعّل',
    exactOff: 'للتنبيه في نفس الدقيقة، فعّل «المنبّهات والتذكيرات» من النظام.',
    exactButton: 'فعّل التوقيت الدقيق', saveSettings: 'احفظ الإعدادات', saved: 'اتحفظت',
    savedMessage: 'ميعاد التذكير والقائمة اتحدّثوا.', notificationError: 'تعذّر جدولة التذكير. جرّب تفعيل الإشعارات من إعدادات الجهاز.',
    storageError: 'حصلت مشكلة أثناء قراءة البيانات المحفوظة. لم يتم حذف أي بيانات.',
    writeError: 'تعذّر حفظ التغيير على الجهاز. حاول مرة تانية.', retry: 'حاول تاني',
    alarmTitle: 'وقت مشتريات البيت! 🛒', alarmBody: 'دي الحاجات اللي محتاجها:',
    alarmEmpty: 'القائمة فاضية. تقدر تضيف اللي ناقصك.',
    openList: 'شوف القائمة', dismiss: 'حاضر',
    itemTooLong: 'اسم الحاجة لازم يكون أقل من ١٦١ حرف.', emptyName: 'اكتب اسم الحاجة الأول.',
    micOff: 'التسجيل متوقف', reminderInfo: 'التذكير بيتحدّث تلقائيًا لما تضيف أو تعدّل حاجة.',
    notificationCaption: 'هيظهر تنبيه بصوت، ومعاه كل الحاجات اللي لسه ناقصة.',
    noAds: 'بدون حسابات أو إعلانات • بياناتك على جهازك فقط',
    permissions: 'صلاحيات التذكير', listeningError: 'التسجيل اتوقف. جرّب تاني.',
    screenBack: 'رجوع', checkedLabel: 'تم الشراء', uncheckedLabel: 'لسه ناقص',
  },
  en: {
    appName: 'Remind Me', tagLine: 'Everything your home needs, in one place',
    hello: 'Home essentials', listLabel: 'This week’s list', shoppingToday: 'Shopping day',
    nextShop: 'Next shopping trip', remaining: 'To buy', bought: 'Bought', items: 'items',
    days: 'days', hours: 'hours', minutes: 'min',
    settings: 'Settings', newItem: 'Add an item', editItem: 'Edit item',
    addHint: 'What is running out at home?', itemName: 'Item name',
    typePlaceholder: 'e.g. eggs, milk, bread...', saveItem: 'Add to list', saveChanges: 'Save changes',
    voice: 'Speak an item', voiceStop: 'Stop recording', listening: 'Listening… say your item',
    voiceArabic: 'العربية', voiceEnglish: 'English', voiceUnavailable: 'Voice input unavailable',
    voiceGoMessage: 'Speech recognition requires an installed APK or development build. You can still type in Expo Go.',
    voiceDeviceMessage: 'Check your device’s speech recognition service and microphone access.',
    voicePermission: 'Allow microphone and speech recognition permissions in your device settings.',
    noItemsTitle: 'All stocked up? 🧺', noItemsBody: 'Add things as soon as you run out. We’ll remind you on shopping day.',
    allDoneTitle: 'Everything is checked! ✨', allDoneBody: 'Tap “Finish shopping” to start fresh.',
    finish: 'Finish shopping', finishConfirmTitle: 'Finish shopping?',
    finishConfirmBody: 'Purchased items will clear. Anything unchecked stays for next week.',
    finishNow: 'Yes, finish', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
    deleteConfirmTitle: 'Delete item?', deleteConfirmBody: 'It will be removed from your weekly list.',
    settingsTitle: 'Make it your routine', shoppingDay: 'Your weekly shopping day', alarmTime: 'Reminder time',
    timeHours: 'Hour', timeMinutes: 'Minute', language: 'App language', arabic: 'العربية', english: 'English',
    notifications: 'Phone notifications', notificationsEnabled: 'Notifications enabled',
    notificationsOff: 'Notifications are off — enable them to get your reminder.',
    notificationsButton: 'Allow notifications', exactOn: 'Exact reminder time enabled',
    exactOff: 'Enable “Alarms & reminders” in Android settings for an on-time alert.',
    exactButton: 'Allow exact reminders', saveSettings: 'Save settings', saved: 'Saved',
    savedMessage: 'Your shopping schedule and reminder have been updated.',
    notificationError: 'Could not schedule a reminder. Check notification settings and retry.',
    storageError: 'Saved data could not be read. No data was deleted.',
    writeError: 'Could not save on this device. Please try again.', retry: 'Retry',
    alarmTitle: 'Shopping time! 🛒', alarmBody: 'Don’t forget these items:',
    alarmEmpty: 'Your list is empty. Add anything you need.',
    openList: 'View list', dismiss: 'Got it',
    itemTooLong: 'Item names must be 160 characters or fewer.', emptyName: 'Enter an item name first.',
    micOff: 'Recording stopped', reminderInfo: 'We update your reminder whenever you change your list.',
    notificationCaption: 'Get a sound and a notification with your complete outstanding list.',
    noAds: 'No accounts or ads • Stored on your device only',
    permissions: 'Reminder permissions', listeningError: 'Recording stopped. Try again.',
    screenBack: 'Back', checkedLabel: 'Purchased', uncheckedLabel: 'Still needed',
  },
} as const;

export type TranslationKey = keyof typeof STRINGS.ar;
export function t(language: Language, key: TranslationKey): string {
  return STRINGS[language][key];
}

const WEEKDAYS = {
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
export function dayLabel(lang: Language, weekday: Weekday): string {
  return WEEKDAYS[lang][weekday - 1] ?? '';
}
export function formatTime(hour: number, minute: number, lang: Language): string {
  const h = hour % 12 || 12;
  const period = hour < 12 ? (lang === 'ar' ? 'ص' : 'AM') : (lang === 'ar' ? 'م' : 'PM');
  return `${h}:${String(minute).padStart(2, '0')} ${period}`;
}
