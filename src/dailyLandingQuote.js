const EMERSON = 'https://www.gutenberg.org/files/2944/2944-h/2944-h.htm';
const ALLEN = 'https://www.gutenberg.org/files/4507/4507-h/4507-h.htm';
const MARCUS = 'https://www.gutenberg.org/files/15877/15877-h/15877-h.htm';
const DHAMMAPADA = 'https://www.gutenberg.org/files/2017/2017-h/2017-h.htm';
// Source-verified quotations/excerpts; excerpt capitalization and final punctuation normalized. Sources are retained for editorial checks,
// but only the quote and author are displayed. New IDs retire the broader old set.
export const LANDING_QUOTES = [
  { id: 'wellbeing-calm-power', text: 'Calmness is power.', author: 'James Allen', source: ALLEN, themes: ['confidence', 'direction', 'growth', 'rest'] },
  { id: 'wellbeing-tranquil-action', text: 'The more tranquil a man becomes, the greater is his success, his influence, his power for good.', author: 'James Allen', source: ALLEN, themes: ['direction', 'growth', 'confidence', 'connection'] },
  { id: 'wellbeing-ordered-mind', text: 'Tranquillity is nothing else than the good ordering of the mind.', author: 'Marcus Aurelius', source: MARCUS, themes: ['direction', 'rest', 'acceptance'] },
  { id: 'wellbeing-renewal', text: 'Constantly then give to thyself this retreat, and renew thyself.', author: 'Marcus Aurelius', source: MARCUS, themes: ['rest', 'growth', 'confidence', 'acceptance'] },
  { id: 'wellbeing-contentment', text: 'Health is the greatest of gifts, contentedness the best riches.', author: 'Gautama Buddha', source: DHAMMAPADA, themes: ['rest', 'acceptance', 'connection', 'growth'] },
  { id: 'wellbeing-rest', text: 'There is no happiness higher than rest.', author: 'Gautama Buddha', source: DHAMMAPADA, themes: ['rest', 'acceptance', 'connection'] },
  { id: 'wellbeing-inner-peace', text: 'Nothing can bring you peace but yourself.', author: 'Ralph Waldo Emerson', source: EMERSON, themes: ['rest', 'confidence', 'acceptance', 'connection'] },
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
export const selectDailyQuote = (conversation, day, userId) => {
  if (!userId || conversation?.user_id !== userId || !(conversation.messages ?? []).some((message) => message.role === 'user')) return null;
  const theme = closingTheme(conversation);
  const pool = LANDING_QUOTES.filter((quote) => quote.themes.includes(theme));
  const dayNumber = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000);
  const offset = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return { day, theme, quoteId: pool[(dayNumber + offset) % pool.length].id };
};
