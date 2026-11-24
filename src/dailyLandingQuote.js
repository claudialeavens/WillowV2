const WALDEN = 'https://www.gutenberg.org/cache/epub/205/pg205-images.html';
const NATURE = 'https://www.gutenberg.org/cache/epub/29433/pg29433-images.html';
const EMERSON = 'https://www.gutenberg.org/files/2944/2944-h/2944-h.htm';
const ALLEN = 'https://www.gutenberg.org/files/4507/4507-h/4507-h.htm';
const MARCUS = 'https://www.gutenberg.org/files/15877/15877-h/15877-h.htm';
const DHAMMAPADA = 'https://www.gutenberg.org/files/2017/2017-h/2017-h.htm';
// Source-verified quotations/excerpts; excerpt capitalization and final punctuation normalized. Sources are retained for editorial checks,
// but only the quote and author are displayed. Short excerpts omit surrounding text without changing their meaning.
export const LANDING_QUOTES = [
  { id: 'wellbeing-calm-power', text: 'Calmness is power.', author: 'James Allen', source: ALLEN, themes: ['confidence', 'direction', 'growth', 'rest'] },
  { id: 'wellbeing-tranquil-action', text: 'The more tranquil a man becomes, the greater is his success, his influence, his power for good.', author: 'James Allen', source: ALLEN, themes: ['direction', 'growth', 'confidence', 'connection'] },
  { id: 'wellbeing-ordered-mind', text: 'Tranquillity is nothing else than the good ordering of the mind.', author: 'Marcus Aurelius', source: MARCUS, themes: ['direction', 'rest', 'acceptance'] },
  { id: 'wellbeing-renewal', text: 'Constantly then give to thyself this retreat, and renew thyself.', author: 'Marcus Aurelius', source: MARCUS, themes: ['rest', 'growth', 'confidence', 'acceptance'] },
  { id: 'wellbeing-contentment', text: 'Health is the greatest of gifts, contentedness the best riches.', author: 'Gautama Buddha', source: DHAMMAPADA, themes: ['rest', 'acceptance', 'connection', 'growth'] },
  { id: 'wellbeing-rest', text: 'There is no happiness higher than rest.', author: 'Gautama Buddha', source: DHAMMAPADA, themes: ['rest', 'acceptance', 'connection'] },
  { id: 'wellbeing-inner-peace', text: 'Nothing can bring you peace but yourself.', author: 'Ralph Waldo Emerson', source: EMERSON, themes: ['rest', 'confidence', 'acceptance', 'connection'] },
  { id: 'wellbeing-calm-wisdom', text: "Calmness of mind is one of the beautiful jewels of wisdom.", author: 'James Allen', source: ALLEN, themes: ['rest', 'confidence'] },
  { id: 'wellbeing-cherish-visions', text: "Cherish your visions; cherish your ideals; cherish the music that stirs in your heart.", author: 'James Allen', source: ALLEN, themes: ['direction', 'growth'] },
  { id: 'wellbeing-enthusiasm', text: "Nothing great was ever achieved without enthusiasm.", author: 'Ralph Waldo Emerson', source: EMERSON, themes: ['growth', 'direction', 'confidence'] },
  { id: 'wellbeing-woods', text: "In the woods, we return to reason and faith.", author: 'Ralph Waldo Emerson', source: NATURE, themes: ['rest', 'acceptance'] },
  { id: 'wellbeing-steady-rock', text: "As a solid rock is not shaken by the wind, wise people falter not amidst blame and praise.", author: 'Gautama Buddha', source: DHAMMAPADA, themes: ['confidence', 'acceptance'] },
  { id: 'wellbeing-small-drops', text: "Even by the falling of water-drops a water-pot is filled.", author: 'Gautama Buddha', source: DHAMMAPADA, themes: ['growth', 'direction'] },
  { id: 'wellbeing-love', text: "Hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule.", author: 'Gautama Buddha', source: DHAMMAPADA, themes: ['connection', 'acceptance'] },
  { id: 'wellbeing-awake', text: "Only that day dawns to which we are awake.", author: 'Henry David Thoreau', source: WALDEN, themes: ['growth', 'rest'] },
  { id: 'wellbeing-foundations', text: "If you have built castles in the air, your work need not be lost; that is where they should be. Now put the foundations under them.", author: 'Henry David Thoreau', source: WALDEN, themes: ['direction', 'growth'] },
  { id: 'wellbeing-change', text: "Things do not change; we change.", author: 'Henry David Thoreau', source: WALDEN, themes: ['growth', 'acceptance'] },
  { id: 'wellbeing-open-mind', text: "It is never too late to give up our prejudices.", author: 'Henry David Thoreau', source: WALDEN, themes: ['connection', 'growth'] },
  { id: 'wellbeing-conscious-endeavor', text: "I know of no more encouraging fact than the unquestionable ability of man to elevate his life by a conscious endeavor.", author: 'Henry David Thoreau', source: WALDEN, themes: ['confidence', 'growth', 'direction'] },
  { id: 'wellbeing-earth', text: "Heaven is under our feet as well as over our heads.", author: 'Henry David Thoreau', source: WALDEN, themes: ['rest', 'acceptance'] },
];
const THEMES = {
  direction: /\b(goal|goals|purpose|direction|decision|decide|plan|career|priority|priorities|meaning|next step|routine|habit)\b/gi,
  rest: /\b(rest|sleep|calm|peace|overwhelm\w*|stress\w*|anxious|anxiety|breathe|breathing|pause|slow|quiet|balance|burnout)\b/gi,
  connection: /\b(friend\w*|connection|connect|lonel\w*|relationship\w*|family|partner|love|belong\w*|listen|listening|support)\b/gi,
  confidence: /\b(confiden\w*|self.trust|trust myself|courage|self.worth|authentic\w*|boundar\w*|my own|voice|judg\w*)\b/gi,
  acceptance: /\b(accept\w*|control|let\w* go|grief|loss|lost|uncertain\w*|change|forgiv\w*|cannot|can't)\b/gi,
  growth: /\b(grow\w*|learn\w*|progress|resilien\w*|hope\w*|begin\w*|start\w*|small step|try|trying|practice|possib\w*)\b/gi,
};
export const closingTheme = (conversation) => {
  const closing = conversation?.summary?.takeaway?.trim();
  const messages = (conversation?.messages ?? []).filter((message) => ['user', 'assistant'].includes(message.role));
  const text = closing || messages.slice(-4).map((message) => message.content ?? '').join(' ');
  let theme = 'growth';
  let highest = 0;
  for (const [name, pattern] of Object.entries(THEMES)) {
    const score = (text.match(pattern) ?? []).length;
    if (score > highest) { theme = name; highest = score; }
  }
  return theme;
};
export const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const selectDailyQuote = (conversation, day, userId, previous = null) => {
  if (!userId || conversation?.user_id !== userId || !(conversation.messages ?? []).some((message) => message.role === 'user')) return null;
  const theme = closingTheme(conversation);
  // Keep the day's quote stable, including after the conversation changes.
  const knownIds = new Set(LANDING_QUOTES.map((quote) => quote.id));
  if (previous?.day === day && knownIds.has(previous.quoteId)) return previous;
  const prior = previous?.day < day ? previous : null;
  let seen = [...new Set([...(Array.isArray(prior?.seenQuoteIds) ? prior.seenQuoteIds : []), prior?.quoteId].filter((id) => knownIds.has(id)))];
  let unseen = LANDING_QUOTES.filter((quote) => !seen.includes(quote.id));
  if (!unseen.length) {
    seen = [];
    unseen = LANDING_QUOTES.filter((quote) => quote.id !== prior?.quoteId);
  }
  // Prefer the conversation's theme, then explore the remaining Willow themes
  // so every quote appears once before the collection starts again.
  const relevant = unseen.filter((quote) => quote.themes.includes(theme));
  const pool = relevant.length ? relevant : unseen;
  const dayNumber = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000);
  const offset = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const quoteId = pool[(dayNumber + offset) % pool.length].id;
  return { day, theme, quoteId, seenQuoteIds: [...seen, quoteId] };
};
