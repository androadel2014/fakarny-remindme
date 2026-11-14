import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAutomaticCarryOverToLists,
  buildReminderSchedulePlan,
  createShoppingList,
  finishShoppingList,
  latestClosedCycleDate,
} from '../src/domain/shopping.ts';
import { migrateLegacyState } from '../src/domain/migration.ts';

const at = (year, month, day, hour = 12, minute = 0) => new Date(year, month, day, hour, minute);
const sampleItems = () => [
  { id: 'done', name: 'Eggs', checked: true, createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-01T10:00:00Z' },
  { id: 'later', name: 'Milk', checked: false, createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-01T10:00:00Z' },
];

 test('a list rolls over on its own cycle boundary without changing another list', () => {
  const sunday = createShoppingList('Sunday Store', sampleItems(), { enabled: true, weekdays: [1], hour: 10, minute: 0 }, at(2026, 10, 8), 'sunday');
  const wednesday = createShoppingList('Wednesday Store', sampleItems(), { enabled: true, weekdays: [4], hour: 18, minute: 30 }, at(2026, 10, 8), 'wednesday');
  const state = { schemaVersion: 2, preferences: { language: 'en' }, hasSeenIntro: true, lists: [sunday, wednesday] };
  const afterSunday = applyAutomaticCarryOverToLists(state, at(2026, 10, 9, 0, 1));
  assert.deepEqual(afterSunday.lists[0].items.map(item => item.id), ['later']);
  assert.deepEqual(afterSunday.lists[1].items.map(item => item.id), ['done', 'later']);
  assert.equal(afterSunday.lists[1], wednesday, 'the other list remains untouched');
});

test('a multi-day reminder list rolls over only after its final selected weekday', () => {
  const list = createShoppingList('Market', sampleItems(), { enabled: true, weekdays: [1, 6], hour: 9, minute: 15 }, at(2026, 10, 8), 'multi-day');
  const state = { schemaVersion: 2, preferences: { language: 'en' }, hasSeenIntro: true, lists: [list] };
  const monday = applyAutomaticCarryOverToLists(state, at(2026, 10, 9, 0, 1));
  assert.equal(monday.lists[0], list, 'Monday is not the end of the Sunday/Friday cycle');
  const saturday = applyAutomaticCarryOverToLists(state, at(2026, 10, 14, 0, 1));
  assert.deepEqual(saturday.lists[0].items.map(item => item.id), ['later']);
  assert.equal(saturday.lists[0].lastHandledShoppingDate, '2026-11-13');
});

test('finishing one list clears only that list and carries its unchecked items', () => {
  const first = createShoppingList('First', sampleItems(), { enabled: true, weekdays: [1], hour: 10, minute: 0 }, at(2026, 10, 8), 'first');
  const second = createShoppingList('Second', sampleItems(), { enabled: true, weekdays: [3], hour: 10, minute: 0 }, at(2026, 10, 8), 'second');
  const state = { schemaVersion: 2, preferences: { language: 'en' }, hasSeenIntro: true, lists: [first, second] };
  const result = finishShoppingList(state, 'first', at(2026, 10, 8, 15));
  assert.deepEqual(result.lists[0].items.map(item => item.id), ['later']);
  assert.deepEqual(result.lists[1].items.map(item => item.id), ['done', 'later']);
});

test('schedule planner creates one independent weekly alarm per selected list weekday', () => {
  const first = createShoppingList('Walmart', [], { enabled: true, weekdays: [1, 3], hour: 10, minute: 5 }, at(2026, 10, 8), 'walmart');
  const second = createShoppingList('Market', [], { enabled: true, weekdays: [5], hour: 18, minute: 45 }, at(2026, 10, 8), 'market');
  const off = createShoppingList('Paused', [], { enabled: false, weekdays: [2, 4], hour: 7, minute: 0 }, at(2026, 10, 8), 'paused');
  const plan = buildReminderSchedulePlan([first, second, off]);
  assert.equal(plan.length, 3);
  assert.deepEqual(plan.map(item => [item.listId, item.weekday, item.hour, item.minute]), [
    ['walmart', 1, 10, 5], ['walmart', 3, 10, 5], ['market', 5, 18, 45],
  ]);
  assert.ok(plan.every(item => item.listId !== 'paused'));
});

test('v1 migration preserves items, checked state, language, and the old alarm', () => {
  const legacy = {
    schemaVersion: 1,
    items: sampleItems(),
    preferences: { weekday: 6, hour: 8, minute: 35, language: 'en' },
    lastHandledShoppingDate: '2026-11-06',
  };
  const migrated = migrateLegacyState(legacy, at(2026, 10, 14));
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.preferences.language, 'en');
  assert.equal(migrated.lists.length, 1);
  assert.equal(migrated.lists[0].name, 'Home store');
  assert.deepEqual(migrated.lists[0].items.map(item => [item.id, item.checked]), [['done', true], ['later', false]]);
  assert.deepEqual(migrated.lists[0].schedule, { enabled: true, weekdays: [6], hour: 8, minute: 35 });
  assert.equal(migrated.lists[0].lastHandledShoppingDate, '2026-11-06');
  assert.equal(migrated.hasSeenIntro, false);
});


test('turning a reminder off silences the alarm but keeps the weekly list cycle', () => {
  const muted = createShoppingList('Quiet Store', sampleItems(), { enabled: false, weekdays: [1], hour: 10, minute: 0 }, at(2026, 10, 8), 'muted');
  const state = { schemaVersion: 2, preferences: { language: 'en' }, hasSeenIntro: true, lists: [muted] };
  const next = applyAutomaticCarryOverToLists(state, at(2026, 10, 9, 0, 1));
  assert.deepEqual(next.lists[0].items.map(item => item.id), ['later']);
  assert.deepEqual(buildReminderSchedulePlan(next.lists), []);
});

test('cycle anchor uses the last selected weekday', () => {
  assert.equal(latestClosedCycleDate(at(2026, 10, 9), [1, 6]), '2026-11-06');
  assert.equal(latestClosedCycleDate(at(2026, 10, 14), [1, 6]), '2026-11-13');
});
