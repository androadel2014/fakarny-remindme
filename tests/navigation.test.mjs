import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveHardwareBack } from '../src/domain/navigation.ts';

test('Android hardware Back navigates one screen at a time and exits only at home', () => {
  assert.equal(resolveHardwareBack('itemEditor', true), 'list');
  assert.equal(resolveHardwareBack('listEditor', true), 'list');
  assert.equal(resolveHardwareBack('listEditor', false), 'home');
  assert.equal(resolveHardwareBack('list', true), 'home');
  assert.equal(resolveHardwareBack('settings', false), 'home');
  assert.equal(resolveHardwareBack('home', false), 'exit');
});
