import test from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, formatTime, progressLabel } from '../src/i18n/strings.ts';

test('every user-facing translation key exists in Arabic and English', () => {
  assert.deepEqual(Object.keys(STRINGS.ar).sort(), Object.keys(STRINGS.en).sort());
  for (const [key, value] of Object.entries(STRINGS.ar)) assert.ok(value.length > 0, `Arabic string ${key} is empty`);
  for (const [key, value] of Object.entries(STRINGS.en)) assert.ok(value.length > 0, `English string ${key} is empty`);
});

test('progress counter is localized in both languages', () => {
  assert.equal(progressLabel('en', 3, 8), '3 of 8');
  assert.equal(progressLabel('ar', 3, 8), '٣ من ٨');
});

test('time formatting uses Arabic digits and Arabic AM/PM markers', () => {
  assert.equal(formatTime(10, 5, 'ar'), '١٠:٠٥ ص');
  assert.equal(formatTime(18, 30, 'ar'), '٦:٣٠ م');
});
