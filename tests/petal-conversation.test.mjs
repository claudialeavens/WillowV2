import test from 'node:test';
import assert from 'node:assert/strict';
import { findPetalConversation } from '../src/petalConversation.js';

const item = { id: 'action-1', text: 'Imagine each path', sourceId: 'source' };
const record = (id, discovery, date = '2026-11-25') => ({ id, summary: { discovery }, messages: [{ role: 'user', content: 'Hello' }], updated_at: date });
test('resumes the latest related action conversation rather than an unrelated recent chat', () => {
  const latest = record('latest', { pinnedActionId: item.id }, '2026-11-26');
  assert.equal(findPetalConversation([record('unrelated', {}, '2026-11-27'), record('old', { pinnedAction: item.text }), latest], item), latest);
});
test('supports earlier conversations matched by action text and falls back to the source', () => {
  const source = record('source', {});
  const related = record('related', { desiredTakeaway: item.text });
  assert.equal(findPetalConversation([source, related], item), related);
  assert.equal(findPetalConversation([source], item), source);
  assert.equal(findPetalConversation([{ ...source, messages: [] }], item), null);
  assert.equal(findPetalConversation([record('other', {})], item), null);
});
