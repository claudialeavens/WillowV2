import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { mergeWellbeingReminders } from '../src/wellbeingReminder.js';

const source = (await readFile(new URL('../src/useTrackingRecord.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replaceAll('export const ', 'const ')
  + '\nglobalThis.hook = useTrackingRecord; globalThis.finishSaves = finishTrackingSaves;';
const tick = () => new Promise((resolve) => setImmediate(resolve));
const settle = async () => { for (let i = 0; i < 8; i++) await tick(); };

function device(account, entries = {}) {
  const storage = new Map(Object.entries(entries));
  const slots = [];
  const effects = [];
  const listeners = new Map();
  let cursor = 0;
  let mounted = false;
  const context = {
    crypto: { randomUUID },
    mergeWellbeingReminders,
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    window: { addEventListener: (event, fn) => listeners.set(event, fn), removeEventListener: (event) => listeners.delete(event) },
    useRef: (initial) => { const i = cursor++; return slots[i] ??= { current: initial }; },
    useState: (initial) => { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], (value) => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useCallback: (fn) => fn,
    useEffect: (fn) => { if (!mounted) effects.push(fn); },
    supabase: { auth: {
      getUser: async () => ({ data: { user: account.id ? { id: account.id, user_metadata: structuredClone(account.metadata) } : null }, error: account.offline ? new Error('offline') : null }),
      updateUser: async ({ data }) => {
        if (account.offline) return { error: new Error('offline') };
        Object.assign(account.metadata, structuredClone(data));
        account.writes++;
        return { error: null };
      },
    } },
  };
  vm.runInNewContext(source, context);
  return {
    storage,
    render(kind = 'focus', id = 'user-a', initial = null, legacy = 'legacy') {
      cursor = 0;
      const result = context.hook(kind, id, initial, legacy);
      if (!mounted) { mounted = true; effects.forEach((fn) => fn()); }
      return result;
    },
    focus: () => listeners.get('focus')?.(),
    online: () => listeners.get('online')?.(),
    finishSaves: () => context.finishSaves(),
  };
}
const account = () => ({ id: 'user-a', metadata: {}, writes: 0 });

test('saves account data and restores it in a different browser and a fresh sign-in', async () => {
  const user = account();
  const first = device(user);
  first.render(); await settle();
  first.render().update({ text: 'Rest more', reason: 'More energy' }); await settle();
  const second = device(user);
  second.render(); await settle();
  assert.equal(second.render().value.text, 'Rest more');
  const signedInAgain = device(user);
  signedInAgain.render(); await settle();
  assert.equal(signedInAgain.render().value.reason, 'More energy');
});

test('imports old account browser data when no account record exists', async () => {
  const user = account();
  const browser = device(user, { legacy: JSON.stringify({ text: 'Sleep', reason: 'Rest' }) });
  browser.render(); await settle();
  assert.equal(user.metadata.willow_tracking_focus.text, 'Sleep');
});

test('existing account reminder wins over an old browser import', async () => {
  const user = account();
  user.metadata.willow_tracking_focus = { text: 'Current', reason: '' };
  const browser = device(user, { legacy: JSON.stringify({ text: 'Old', reason: '' }) });
  browser.render(); await settle();
  assert.equal(browser.render().value.text, 'Current');
  assert.equal(user.writes, 0);
});

test('offline edits remain pending and retry on reconnect', async () => {
  const user = account();
  const browser = device(user);
  browser.render(); await settle();
  user.offline = true;
  browser.render().update({ text: 'Breathe', reason: '' }); await settle();
  assert.match(browser.render().status, /sync unavailable/);
  user.offline = false;
  await browser.online(); await settle();
  assert.equal(user.metadata.willow_tracking_focus.text, 'Breathe');
  assert.match(browser.render().status, /Saved to your account/);
});

test('guest data stays local and cannot overwrite another account', async () => {
  const user = account();
  const browser = device(user);
  browser.render('focus', null); await settle();
  browser.render('focus', null).update({ text: 'Guest', reason: '' }); await settle();
  assert.equal(user.writes, 0);
  const other = device(user);
  other.render('focus', 'user-b'); await settle();
  other.render('focus', 'user-b').update({ text: 'Wrong account', reason: '' }); await settle();
  assert.equal(user.writes, 0);
});

test('habit check-ins and notes restore on another device', async () => {
  const user = account();
  const habit = { title: 'Walk', intention: 'Fresh air', days: ['2026-11-3'], note: 'Calmer' };
  const browser = device(user);
  browser.render('habit', 'user-a', habit); await settle();
  browser.render('habit', 'user-a', habit).update(habit); await settle();
  const other = device(user);
  other.render('habit', 'user-a', habit); await settle();
  assert.deepEqual(JSON.parse(JSON.stringify(other.render('habit', 'user-a', habit).value)), habit);
});

test('focus refresh picks up changes made on another device', async () => {
  const user = account();
  const browser = device(user);
  browser.render(); await settle();
  user.metadata.willow_tracking_focus = { text: 'New focus', reason: '' };
  await browser.focus(); await settle();
  assert.equal(browser.render().value.text, 'New focus');
});

test('rapid updates retain the final value', async () => {
  const user = account();
  const browser = device(user);
  browser.render(); await settle();
  for (let i = 0; i < 15; i++) browser.render().update({ text: `Update ${i}`, reason: '' });
  await settle();
  assert.equal(user.metadata.willow_tracking_focus.text, 'Update 14');
});

test('sign-out waits for in-flight tracking writes', async () => {
  const user = account();
  const browser = device(user);
  browser.render(); await settle();
  browser.render().update({ text: 'Before sign-out', reason: '' });
  await browser.finishSaves();
  user.id = null;
  assert.equal(user.metadata.willow_tracking_focus.text, 'Before sign-out');
});

test('separate goal names and check-ins sync and restore with the habit', async () => {
  const user = account();
  const habit = { title: 'Movement', intention: 'Feel good', days: ['2026-11-2'], note: '', goals: [{ id: 'meditation', title: 'Meditation', days: ['2026-11-3'] }] };
  const first = device(user);
  first.render('habit', 'user-a', habit); await settle();
  first.render('habit', 'user-a', habit).update(habit); await first.finishSaves();
  const second = device(user);
  second.render('habit', 'user-a', { ...habit, goals: [] }); await settle();
  assert.deepEqual(JSON.parse(JSON.stringify(second.render('habit', 'user-a', habit).value)), habit);
});

test('combined wellbeing intention preserves both earlier account reminders', async () => {
  const user = account();
  user.metadata.willow_tracking_focus = { text: 'Sleep better', reason: 'Feel rested' };
  user.metadata.willow_tracking_intention = { text: 'Pause more', reason: 'Feel calm' };
  const browser = device(user);
  browser.render('wellbeing'); await settle();
  assert.equal(browser.render('wellbeing').value.text, 'Sleep better\n\nPause more');
  assert.equal(user.metadata.willow_tracking_wellbeing.reason, 'Feel rested\n\nFeel calm');
  const second = device(user);
  second.render('wellbeing'); await settle();
  assert.equal(second.render('wellbeing').value.text, 'Sleep better\n\nPause more');
});

test('combined reminder takes priority after being edited', async () => {
  const user = account();
  user.metadata.willow_tracking_focus = { text: 'Old focus', reason: '' };
  user.metadata.willow_tracking_wellbeing = { text: 'My current intention', reason: '' };
  const browser = device(user);
  browser.render('wellbeing'); await settle();
  assert.equal(browser.render('wellbeing').value.text, 'My current intention');
});

test('old guest focus and intention combine locally without account writes', async () => {
  const user = account();
  const browser = device(user, {
    'willow-focus-reminder:guest': JSON.stringify({ text: 'Rest', reason: '' }),
    'willow-intention-reminder:guest': JSON.stringify({ text: 'Breathe', reason: '' }),
  });
  assert.equal(browser.render('wellbeing', null).value.text, 'Rest\n\nBreathe');
  await settle();
  assert.equal(user.writes, 0);
});
