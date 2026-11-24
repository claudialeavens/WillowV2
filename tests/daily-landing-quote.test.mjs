import test from 'node:test';
import assert from 'node:assert/strict';
import { closingTheme, localDay, selectDailyQuote, LANDING_QUOTES } from '../src/dailyLandingQuote.js';
const conversation = { user_id: 'account-a', messages: [{ role: 'user', content: 'I am overwhelmed and need sleep' }, { role: 'assistant', content: 'Let us rest.' }], summary: { takeaway: 'You chose a clear career goal and next step toward your purpose.' } };
test('closing takeaway outweighs the opening issue', () => assert.equal(closingTheme(conversation), 'direction'));
test('without a takeaway, matching uses closing exchanges instead of opening topic', () => {
  const messages = [{ role: 'user', content: 'stress anxiety sleep rest' }, ...Array.from({ length: 4 }, () => ({ role: 'user', content: 'I want connection with friends and family' }))];
  assert.equal(closingTheme({ messages }), 'connection');
});
test('signed-out, first-time, and other-account history retain the welcome message', () => {
  assert.equal(selectDailyQuote(conversation, '2026-11-11', null), null);
  assert.equal(selectDailyQuote(null, '2026-11-11', 'account-a'), null);
  assert.equal(selectDailyQuote(conversation, '2026-11-11', 'account-b'), null);
});
test('daily selection is deterministic, attributed, and changes on consecutive days', () => {
  const first = selectDailyQuote(conversation, '2026-11-11', 'account-a');
  assert.deepEqual(first, selectDailyQuote(conversation, '2026-11-11', 'account-a'));
  assert.notEqual(first.quoteId, selectDailyQuote(conversation, '2026-11-12', 'account-a').quoteId);
  assert.ok(LANDING_QUOTES.find((quote) => quote.id === first.quoteId)?.source.startsWith('https://www.gutenberg.org/'));
});
test('day boundary uses local calendar fields', () => assert.equal(localDay(new Date(2026, 10, 11, 23, 59)), '2026-11-11'));

test('every daily quote belongs to the calm, clarity, and wellbeing collection', () => {
  const authors = new Set(['James Allen', 'Marcus Aurelius', 'Gautama Buddha', 'Ralph Waldo Emerson', 'Henry David Thoreau']);
  for (const quote of LANDING_QUOTES) {
    assert.ok(quote.id.startsWith('wellbeing-'));
    assert.ok(authors.has(quote.author));
    assert.ok(quote.themes.length > 0);
    assert.ok(quote.source.startsWith('https://www.gutenberg.org/'));
  }
  for (const theme of ['direction', 'rest', 'connection', 'confidence', 'acceptance', 'growth']) {
    assert.ok(LANDING_QUOTES.filter((quote) => quote.themes.includes(theme)).length >= 2);
  }
});

test('each new day excludes the last displayed quote across every topic change', () => {
  const topics = ['goal', 'rest', 'family', 'confidence', 'accept', 'grow'];
  for (const before of topics) for (const after of topics) {
    const history = (takeaway) => ({ ...conversation, summary: { takeaway } });
    const previous = selectDailyQuote(history(before), '2026-11-16', 'account-a');
    const next = selectDailyQuote(history(after), '2026-11-17', 'account-a', previous);
    assert.notEqual(next.quoteId, previous.quoteId, `${before} → ${after}`);
    assert.ok(LANDING_QUOTES.find((quote) => quote.id === next.quoteId).themes.includes(next.theme));
  }
});

test('returning after several days still gives a different relevant quote', () => {
  const previous = selectDailyQuote(conversation, '2026-11-11', 'account-a');
  for (let day = 12; day <= 30; day++) {
    const next = selectDailyQuote(conversation, `2026-11-${day}`, 'account-a', previous);
    assert.notEqual(next.quoteId, previous.quoteId);
  }
});

test('collection contains at least twenty distinct quotes and cycles without repeats', () => {
  assert.ok(LANDING_QUOTES.length >= 20);
  assert.equal(new Set(LANDING_QUOTES.map(q => q.text)).size, LANDING_QUOTES.length);
  const displayed = new Set();
  let saved = null;
  for (let i = 0; i < LANDING_QUOTES.length; i++) {
    const day = new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10);
    saved = selectDailyQuote(conversation, day, 'account-a', saved);
    assert.ok(!displayed.has(saved.quoteId));
    displayed.add(saved.quoteId);
    saved = JSON.parse(JSON.stringify(saved)); // restored account data retains progress
  }
  const next = selectDailyQuote(conversation, '2026-12-01', 'account-a', saved);
  assert.notEqual(next.quoteId, saved.quoteId);
  assert.equal(next.seenQuoteIds.length, 1);
});
test('same-day quote stays stable after conversation topic changes', () => {
  const saved = selectDailyQuote(conversation, '2026-11-24', 'account-a');
  assert.deepEqual(selectDailyQuote({ ...conversation, summary: { takeaway: 'rest sleep calm' } }, saved.day, 'account-a', saved), saved);
});
