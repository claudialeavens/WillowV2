import test from 'node:test';
import assert from 'node:assert/strict';
import { requestCustomDiscovery } from '../src/requestCustomDiscovery.js';
const valid = JSON.stringify({ question: 'What would you most like help with?', options: ['Ideas', 'Practice', 'Confidence'].map(title => ({ title, caption: 'For meaningful conversations' })) });
const args = { choice: 'Feeling connected', answers: [{ question: 'What feels closest?', answer: 'Tools for asking engaging questions' }] };
test('a malformed response retries once without changing the person’s answers', async () => {
  let calls = 0;
  const result = await requestCustomDiscovery({ ...args, request: async messages => {
    assert.deepEqual(JSON.parse(messages[1].content).answers, args.answers);
    return ++calls === 1 ? 'not usable JSON' : valid;
  } });
  assert.equal(calls, 2);
  assert.equal(result.options.length, 3);
});
test('transient service failures retry, but authentication failures do not', async () => {
  let calls = 0;
  await requestCustomDiscovery({ ...args, request: async () => {
    if (++calls === 1) throw Object.assign(new Error('Unavailable'), { status: 503 });
    return valid;
  } });
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(requestCustomDiscovery({ ...args, request: async () => { calls++; throw Object.assign(new Error('Unauthorized'), { status: 401 }); } }));
  assert.equal(calls, 1);
});
test('retries are bounded and an aborted request never retries', async () => {
  let calls = 0;
  await assert.rejects(requestCustomDiscovery({ ...args, request: async () => { calls++; return 'bad response'; } }));
  assert.equal(calls, 2);
  const controller = new AbortController();
  calls = 0;
  await assert.rejects(requestCustomDiscovery({ ...args, signal: controller.signal, request: async () => { calls++; controller.abort(); return 'bad'; } }));
  assert.equal(calls, 1);
});
