import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewArchivePetals } from '../src/archivePetalReview.js';
const store = () => { const data = new Map(); return { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) }; };
const record = (id, text, user_id = 'a') => ({ id, user_id, title: id, messages: [{ role: 'user', content: text }] });
test('captures indirect and noun-phrase actions with validated source evidence', async () => {
  const result = await reviewArchivePetals([record('one', 'What I settled on was a call to Mum and an earlier bedtime.')], 'a', { storage: store(), request: async () => JSON.stringify([{ evidence: 'a call to Mum', petal: 'Feeling connected' }, { evidence: 'an earlier bedtime', petal: 'Energy & vitality' }]) });
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].sourceId, 'one');
  assert.equal(result.items[1].petal, 'Energy & vitality');
});
test('rejects invented action text that does not occur in the source', async () => {
  const result = await reviewArchivePetals([record('one', 'I felt heard and understood.')], 'a', { storage: store(), request: async () => JSON.stringify([{ evidence: 'Book a dentist appointment', petal: 'Managing everyday life' }]) });
  assert.deepEqual(result.items, []);
});
test('scans every conversation and isolates accounts', async () => {
  let calls = 0;
  const result = await reviewArchivePetals([record('old', 'a call to Mum'), record('other', 'Private other account', 'b'), record('new', 'an earlier bedtime')], 'a', { storage: store(), request: async () => { calls++; return '[]'; } });
  assert.equal(calls, 2);
  assert.ok(result.complete);
});
test('reviews long conversation tails and caches unchanged history', async () => {
  const storage = store(); let calls = 0;
  const records = [record('one', 'Background. '.repeat(2000) + 'a call to Mum')];
  const request = async messages => { calls++; return JSON.stringify(messages[0].content.includes('a call to Mum') ? [{ evidence: 'a call to Mum', petal: 'Feeling connected' }] : []); };
  const first = await reviewArchivePetals(records, 'a', { storage, request });
  assert.ok(calls >= 3);
  assert.equal(first.items.length, 1);
  const previousCalls = calls;
  const second = await reviewArchivePetals(records, 'a', { storage, request });
  assert.equal(calls, previousCalls);
  assert.equal(second.items.length, 1);
  records[0].messages[0].content += ' and time to enjoy music';
  await reviewArchivePetals(records, 'a', { storage, request });
  assert.ok(calls > previousCalls);
});
test('falls back to explicit action extraction on service failure and retries later', async () => {
  const storage = store(); let calls = 0;
  const request = async () => { calls++; throw Error('offline'); };
  const records = [record('one', 'Reply to emails.')];
  const result = await reviewArchivePetals(records, 'a', { storage, request });
  assert.equal(result.complete, false);
  assert.equal(result.items[0].text, 'Reply to emails.');
  await reviewArchivePetals(records, 'a', { storage, request });
  assert.equal(calls, 2);
});
test('empty archive stays empty without generating examples', async () => {
  const result = await reviewArchivePetals([], 'a', { storage: store(), request: async () => { throw Error('should not call'); } });
  assert.deepEqual(result.items, []);
  assert.ok(result.complete);
});
test('aborting a review prevents further requests', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(reviewArchivePetals([record('one', 'a call to Mum')], 'a', { signal: controller.signal, storage: store(), request: async () => '[]' }), { name: 'AbortError' });
});
