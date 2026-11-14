import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAutomaticCarryOver, carryOverUnchecked, createInitialState,
  finishShopping, latestClosedShoppingDay, nextShoppingAt, updatePreferences,
} from '../src/domain/shopping.ts';

const fixture = [
  { id: 'eggs', name: 'Eggs', checked: true, createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-01T10:00:00Z' },
  { id: 'milk', name: 'Milk', checked: false, createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-01T10:00:00Z' },
  { id: 'flour', name: 'دقيق', checked: false, createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-01T10:00:00Z' },
];
function stateOnSunday() {
  return { ...createInitialState(new Date(2026, 10, 8, 15)), items: fixture, preferences: { weekday: 1, hour: 10, minute: 0, language: 'ar' } };
}

test('checked items clear and unchecked carry forward, keeping ids and order', () => {
  const result = carryOverUnchecked(fixture);
  assert.deepEqual(result.map(x => x.id), ['milk', 'flour']);
  assert.ok(result.every(x => x.checked === false));
  assert.equal(fixture.length, 3, 'pure function must not mutate original');
});

test('manual finish on shopping day marks that day handled, clears only purchased items', () => {
  const state = stateOnSunday();
  const result = finishShopping(state, new Date(2026, 10, 8, 16));
  assert.equal(result.lastHandledShoppingDate, '2026-11-08');
  assert.deepEqual(result.items.map(x => x.name), ['Milk', 'دقيق']);
});

test('automatic carry-over runs after shopping-day midnight', () => {
  const state = stateOnSunday();
  const result = applyAutomaticCarryOver(state, new Date(2026, 10, 9, 0, 1));
  assert.equal(result.lastHandledShoppingDate, '2026-11-08');
  assert.deepEqual(result.items.map(x => x.id), ['milk', 'flour']);
});

test('no automatic carry-over during shopping day; prior weekday is closed', () => {
  const state = stateOnSunday();
  assert.equal(applyAutomaticCarryOver(state, new Date(2026, 10, 8, 23, 59)), state);
  assert.equal(latestClosedShoppingDay(new Date(2026, 10, 8, 23, 59), 1), '2026-11-01');
});

test('manual finish does not duplicate clearing after the same Sunday ends', () => {
  const finished = finishShopping(stateOnSunday(), new Date(2026, 10, 8, 11));
  const nextDay = applyAutomaticCarryOver(finished, new Date(2026, 10, 9, 3));
  assert.equal(nextDay, finished, 'already handled = no-op');
});

test('missed multiple weeks are caught up idempotently on next launch', () => {
  const state = stateOnSunday();
  const late = applyAutomaticCarryOver(state, new Date(2026, 11, 1, 9));
  assert.deepEqual(late.items.map(x => x.id), ['milk', 'flour']);
  assert.equal(late.lastHandledShoppingDate, '2026-11-29');
  assert.equal(applyAutomaticCarryOver(late, new Date(2026, 11, 1, 9)), late);
});

test('changing weekday resets roll-over anchor without clearing the list', () => {
  const state = stateOnSunday();
  const changed = updatePreferences(state, { ...state.preferences, weekday: 5 }, new Date(2026, 10, 9, 12));
  assert.equal(changed.lastHandledShoppingDate, '2026-11-05');
  assert.equal(changed.items, state.items);
});

test('next reminder at same-minute or past time is next week', () => {
  const state = stateOnSunday();
  const upcoming = nextShoppingAt(new Date(2026, 10, 8, 9, 59), state.preferences);
  assert.equal(upcoming.getDate(), 8);
  const following = nextShoppingAt(new Date(2026, 10, 8, 10, 0), state.preferences);
  assert.equal(following.getDate(), 15);
});

test('after finishing early, next shopping day still performs carry-over normally', () => {
  const state = stateOnSunday();
  const finishedEarly = finishShopping(state, new Date(2026, 10, 7, 11));
  const later = { ...finishedEarly, items: [...finishedEarly.items, { ...fixture[0], id: 'new-egg', checked: true }] };
  const result = applyAutomaticCarryOver(later, new Date(2026, 10, 9, 1));
  assert.deepEqual(result.items.map(x => x.id), ['milk', 'flour']);
});
