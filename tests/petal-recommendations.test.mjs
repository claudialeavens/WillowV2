import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveRecommendations, classifyPetal } from '../src/petalRecommendations.js';
const record = (id, messages, extra = {}) => ({ id, user_id: 'a', updated_at: '2026-11-18', messages: messages.map(content => ({ role: 'user', content })), ...extra });
test('sorts explicit actions into each of the six petals', () => {
  const pairs = [
    ['Plan a meaningful weekend with family.', 'Feeling connected'],
    ['Go to bed earlier tonight.', 'Energy & vitality'],
    ['Get outside for fresh air.', 'Joy & enjoyment'],
    ['Take a 10-minute pause for breathing practice.', 'Peace of mind'],
    ['Reflect on what matters most.', 'Meaning & purpose'],
    ['Finalize to-do list for the week.', 'Managing everyday life'],
  ];
  const result = archiveRecommendations([record('one', pairs.map(([text]) => text))], 'a');
  assert.equal(result.length, 6);
  for (const [text, petal] of pairs) assert.equal(result.find(item => item.text === text).petal, petal);
});
test('scans older history, takeaways, and assistant suggestions with source attribution', () => {
  const old = record('old', ['I will call my friend tomorrow.'], { updated_at: '2025-01-01' });
  const recent = record('new', [], { summary: { takeaway: 'Take a short walk after lunch.' }, messages: [{ role: 'assistant', content: '1. Reply to emails.\n2. Book appointments.' }] });
  const result = archiveRecommendations([old, recent], 'a');
  assert.equal(result.length, 4);
  assert.ok(result.some(item => item.sourceId === 'old'));
  assert.equal(result.find(item => item.text.startsWith('Take')).role, 'takeaway');
  assert.equal(result.find(item => item.text.startsWith('Reply')).record.id, 'new');
});
test('does not turn questions, negated or completed actions, or descriptive text into tasks', () => {
  assert.deepEqual(archiveRecommendations([record('one', ['I already finished the emails.', "I don't want to call my friend.", 'Call my friend?', 'You seem to need rest.', 'I will not go for a walk.'])], 'a'), []);
});
test('isolates accounts and guest history and ignores activity-only records', () => {
  const a = record('a', ['Reply to emails.']);
  const b = record('b', ['Book appointments.'], { user_id: 'b' });
  const guest = record('guest', ['Prepare a nourishing meal.'], { user_id: null });
  const activity = record('activity', ['Call my friend tomorrow.'], { summary: { kind: 'activity' } });
  assert.deepEqual(archiveRecommendations([a, b, guest, activity], 'a').map(item => item.sourceId), ['a']);
  assert.deepEqual(archiveRecommendations([a, b, guest], null).map(item => item.sourceId), ['guest']);
});
test('deduplicates action text across conversations, favoring the newest source', () => {
  const old = record('old', ['Reply to emails.'], { updated_at: '2025-01-01' });
  const recent = record('recent', ['Reply to emails.']);
  assert.equal(archiveRecommendations([old, recent], 'a').length, 1);
  assert.equal(archiveRecommendations([old, recent], 'a')[0].sourceId, 'recent');
});
test('uses a saved petal to resolve ties and unclassified actions', () => {
  assert.equal(classifyPetal('Make time for something important.', 'Meaning & purpose'), 'Meaning & purpose');
});
