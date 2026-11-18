import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAutomaticCarryOverToList, applyAutomaticCarryOverToLists, buildReminderSchedulePlan,
  createShoppingList, finishShoppingList, latestClosedMonthlyCycleDate,
  nextMonthlyReminderAt, nextReminderAt, updateListSchedule,
} from '../src/domain/shopping.ts';
import { parseCurrentState } from '../src/domain/stateCodec.ts';
import { getListDisplayName, getTemplate } from '../src/domain/templates.ts';
import { buildSharedListMessage, GOOGLE_PLAY_DOWNLOAD_URL } from '../src/domain/share.ts';
import { formatListSchedule } from '../src/i18n/strings.ts';

const at = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const monthly = (dayOfMonth = 15, enabled = true) => ({ enabled, cadence: 'monthly', weekdays: [], dayOfMonth, hour: 10, minute: 30 });
const items = () => [
  { id: 'done', name: 'Rice', checked: true, createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z' },
  { id: 'later', name: 'Sugar', checked: false, createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z' },
];

test('monthly cycle stays open on the chosen day and closes the next local midnight', () => {
  assert.equal(latestClosedMonthlyCycleDate(at(2026, 3, 15, 23, 59), 15), '2026-02-15');
  assert.equal(latestClosedMonthlyCycleDate(at(2026, 3, 16, 0, 0), 15), '2026-03-15');
  assert.equal(latestClosedMonthlyCycleDate(at(2026, 3, 1), 1), '2026-02-01');
  assert.equal(latestClosedMonthlyCycleDate(at(2026, 3, 2), 1), '2026-03-01');
});

test('monthly cycle handles February (including leap years), year rollover, and day 28', () => {
  assert.equal(latestClosedMonthlyCycleDate(at(2026, 3, 1), 28), '2026-02-28');
  assert.equal(latestClosedMonthlyCycleDate(at(2024, 2, 29), 28), '2024-02-28');
  assert.equal(latestClosedMonthlyCycleDate(at(2026, 1, 1), 28), '2025-12-28');
  assert.equal(latestClosedMonthlyCycleDate(at(2027, 1, 1), 1), '2026-12-01');
  for (const day of [0, 29, 31, 1.5, NaN]) {
    assert.throws(() => latestClosedMonthlyCycleDate(at(2026, 11, 18), day), RangeError);
  }
});

test('monthly rollover clears checked items after boundary, retains unchecked and is idempotent', () => {
  const original = createShoppingList('Big Shop', items(), monthly(15), at(2026, 1, 14), 'big');
  const onDay = applyAutomaticCarryOverToList(original, at(2026, 1, 15, 23, 59));
  assert.equal(onDay, original);
  const after = applyAutomaticCarryOverToList(original, at(2026, 1, 16, 0, 0));
  assert.equal(after.lastHandledShoppingDate, '2026-01-15');
  assert.deepEqual(after.items.map(item => item.id), ['later']);
  assert.equal(applyAutomaticCarryOverToList(after, at(2026, 1, 16, 0, 1)), after);
  assert.equal(original.items.length, 2);
});

test('monthly rollover across month and year carries unchecked items even with notifications muted', () => {
  const a = createShoppingList('Monthly', items(), monthly(28, false), at(2026, 11, 27), 'month');
  const b = createShoppingList('Weekly', items(), { enabled: true, weekdays: [1], hour: 9, minute: 0 }, at(2026, 11, 27), 'week');
  const state = { schemaVersion: 3, lists: [a, b], preferences: { language: 'en' }, hasSeenIntro: true };
  const changed = applyAutomaticCarryOverToLists(state, at(2027, 1, 2));
  assert.equal(changed.lists[0].lastHandledShoppingDate, '2026-12-28');
  assert.deepEqual(changed.lists[0].items.map(x => x.id), ['later']);
  assert.equal(changed.lists[1].id, 'week');
  assert.ok(!buildReminderSchedulePlan(changed.lists).some(entry => entry.listId === 'month'));
});

test('manually finishing a monthly list on its cycle day marks that boundary handled', () => {
  const a = createShoppingList('Monthly', items(), monthly(15), at(2026, 1, 14), 'month');
  const s = { schemaVersion: 3, lists: [a], preferences: { language: 'en' }, hasSeenIntro: true };
  const finished = finishShoppingList(s, 'month', at(2026, 1, 15, 16));
  assert.equal(finished.lists[0].lastHandledShoppingDate, '2026-01-15');
  assert.equal(applyAutomaticCarryOverToList(finished.lists[0], at(2026, 1, 16)), finished.lists[0]);
});

test('changing only time or notification toggle retains anchor; switching cadence/day resets it', () => {
  const original = createShoppingList('Monthly', items(), monthly(5), at(2026, 5, 10), 'month');
  const same = updateListSchedule(original, { ...original.schedule, enabled: false, hour: 18 }, at(2026, 6, 10));
  assert.equal(same.lastHandledShoppingDate, original.lastHandledShoppingDate);
  const dayChanged = updateListSchedule(original, monthly(20), at(2026, 5, 10));
  assert.equal(dayChanged.lastHandledShoppingDate, '2026-04-20');
  const weekly = updateListSchedule(original, { enabled: true, cadence: 'weekly', weekdays: [1], hour: 10, minute: 30 }, at(2026, 5, 10));
  assert.equal(weekly.schedule.cadence, 'weekly');
  assert.ok(!('dayOfMonth' in weekly.schedule));
  assert.deepEqual(weekly.items, original.items);
});

test('next monthly reminder handles current day past time, months, leap years, and year end', () => {
  assert.equal(nextReminderAt(monthly(15), at(2026, 11, 14)).getTime(), at(2026, 11, 15, 10, 30).getTime());
  assert.equal(nextReminderAt(monthly(15), at(2026, 11, 15, 10, 29)).getTime(), at(2026, 11, 15, 10, 30).getTime());
  assert.equal(nextReminderAt(monthly(15), at(2026, 11, 15, 10, 30)).getTime(), at(2026, 12, 15, 10, 30).getTime());
  assert.equal(nextReminderAt(monthly(28), at(2026, 1, 29)).getTime(), at(2026, 2, 28, 10, 30).getTime());
  assert.equal(nextMonthlyReminderAt(28, 10, 30, at(2024, 1, 31)).getTime(), at(2024, 2, 28, 10, 30).getTime());
  assert.equal(nextMonthlyReminderAt(1, 10, 30, at(2026, 12, 31)).getTime(), at(2027, 1, 1, 10, 30).getTime());
  assert.equal(nextReminderAt(monthly(15, false), at(2026, 11, 14)), null);
});

test('planner creates exactly one monthly trigger per enabled monthly list, alongside existing weekly ones', () => {
  const month = createShoppingList('Costco', [], monthly(20), at(2026, 11, 2), 'costco');
  const week = createShoppingList('Walmart', [], { enabled: true, weekdays: [1, 3], hour: 11, minute: 15 }, at(2026, 11, 2), 'walmart');
  const quiet = createShoppingList('Quiet', [], monthly(10, false), at(2026, 11, 2), 'quiet');
  const plan = buildReminderSchedulePlan([month, week, quiet]);
  assert.deepEqual(plan.map(({ cadence, listId }) => [cadence, listId]), [['monthly', 'costco'], ['weekly', 'walmart'], ['weekly', 'walmart']]);
  assert.deepEqual(plan[0], { listId: 'costco', listName: 'Costco', cadence: 'monthly', dayOfMonth: 20, hour: 10, minute: 30 });
});

test('v2 saved state upgrades to v3 weekly without losing items, times, preferences, or rollover date', () => {
  const v2 = { schemaVersion: 2, hasSeenIntro: true, preferences: { language: 'ar' }, lists: [
    { id: 'old', name: 'بقالة', items: items(), schedule: { enabled: false, weekdays: [2, 5], hour: 18, minute: 45 }, lastHandledShoppingDate: '2026-10-30' },
  ] };
  const migrated = parseCurrentState(v2, at(2026, 11, 3));
  assert.equal(migrated.schemaVersion, 3);
  assert.deepEqual(migrated.lists[0].items, v2.lists[0].items);
  assert.deepEqual(migrated.lists[0].schedule, { cadence: 'weekly', enabled: false, weekdays: [2, 5], hour: 18, minute: 45 });
  assert.equal(migrated.lists[0].lastHandledShoppingDate, '2026-10-30');
  assert.deepEqual(migrated.preferences, { language: 'ar' });
  assert.equal(migrated.hasSeenIntro, true);
  assert.deepEqual(parseCurrentState(JSON.parse(JSON.stringify(migrated)), at(2026, 11, 3)), migrated);
});

test('v3 monthly saved state round-trips, with strict day-of-month validation', () => {
  const list = createShoppingList('Monthly', items(), monthly(28), at(2026, 11, 1), 'monthly');
  const state = { schemaVersion: 3, lists: [list], preferences: { language: 'en' }, hasSeenIntro: true };
  const read = parseCurrentState(JSON.parse(JSON.stringify(state)), at(2026, 11, 1));
  assert.deepEqual(read, state);
  const corrupt = structuredClone(state);
  corrupt.lists[0].schedule.dayOfMonth = 31;
  assert.equal(parseCurrentState(corrupt).lists[0].schedule.dayOfMonth, 1);
});

test('monthly template has matching eight Arabic/English staples and localized list summaries', () => {
  const ar = getTemplate('monthly', 'ar');
  const en = getTemplate('monthly', 'en');
  assert.equal(ar.name, 'مشتريات الشهر');
  assert.equal(en.name, 'Monthly shopping');
  assert.equal(ar.items.length, 8);
  assert.equal(en.items.length, 8);
  assert.equal(ar.items[0].name, 'أرز');
  assert.equal(en.items.at(-1).name, 'Tissues');
  assert.match(formatListSchedule('ar', monthly(15)), /شهري.*١٥/);
  assert.match(formatListSchedule('en', monthly(15)), /Monthly.*15/);
  assert.match(formatListSchedule('en', { enabled: true, weekdays: [1], hour: 10, minute: 0 }), /Weekly.*Sunday/);
});


test('built-in list names follow the selected language while custom names stay user-authored', () => {
  assert.equal(getListDisplayName({ name: 'مشتريات الشهر' }, 'en'), 'Monthly shopping');
  assert.equal(getListDisplayName({ name: 'Monthly shopping' }, 'ar'), 'مشتريات الشهر');
  assert.equal(getListDisplayName({ name: 'My local store', localizedNames: { ar: 'متجري', en: 'My local store' } }, 'ar'), 'متجري');
  assert.equal(getListDisplayName({ name: 'كارفور' }, 'en'), 'كارفور');
});

test('v3 preferences persist manual theme mode and localized list labels', () => {
  const list = createShoppingList('Monthly shopping', [], monthly(10), at(2026, 11, 1), 'month', { ar: 'مشتريات الشهر', en: 'Monthly shopping' });
  const state = { schemaVersion: 3, lists: [list], preferences: { language: 'en', themeMode: 'dark' }, hasSeenIntro: true };
  const read = parseCurrentState(JSON.parse(JSON.stringify(state)), at(2026, 11, 1));
  assert.deepEqual(read.preferences, { language: 'en', themeMode: 'dark' });
  assert.deepEqual(read.lists[0].localizedNames, { ar: 'مشتريات الشهر', en: 'Monthly shopping' });
  assert.deepEqual(parseCurrentState(JSON.parse(JSON.stringify(read)), at(2026, 11, 1)), read);
});


test('shared lists end with a localized Fakarny footer and the Play Store link', () => {
  const list = createShoppingList('مشتريات الشهر', items(), monthly(15), at(2026, 11, 1), 'share-month', { ar: 'مشتريات الشهر', en: 'Monthly shopping' });
  const english = buildSharedListMessage(list, 'en');
  const arabic = buildSharedListMessage(list, 'ar');
  assert.equal(english.title, 'Monthly shopping');
  assert.ok(english.message.endsWith(`List created by Fakarny\nDownload the app: ${GOOGLE_PLAY_DOWNLOAD_URL}`));
  assert.ok(arabic.message.endsWith(`تم إنشاء القائمة باستخدام فكّرني\nحمّل التطبيق: ${GOOGLE_PLAY_DOWNLOAD_URL}`));
  assert.match(english.message, /✓ Rice/);
  assert.match(english.message, /• Sugar/);
});
