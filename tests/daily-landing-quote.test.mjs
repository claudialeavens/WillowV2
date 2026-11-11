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
  const authors = new Set(['James Allen', 'Marcus Aurelius', 'Gautama Buddha', 'Ralph Waldo Emerson']);
  for (const quote of LANDING_QUOTES) {
    assert.ok(quote.id.startsWith('wellbeing-'));
    assert.ok(authors.has(quote.author));
    assert.match(quote.text, /calm|tranquil|renew|health|rest|peace/i);
  }
  for (const theme of ['direction', 'rest', 'connection', 'confidence', 'acceptance', 'growth']) {
    assert.ok(LANDING_QUOTES.filter((quote) => quote.themes.includes(theme)).length >= 2);
  }
});
