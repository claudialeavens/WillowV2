const EMERSON = 'https://www.gutenberg.org/files/2944/2944-h/2944-h.htm';
const THOREAU = 'https://www.gutenberg.org/files/205/205-h/205-h.htm';
// Verified against the original works linked here; keep quotations verbatim.
export const LANDING_QUOTES = [
  { id: 'trust', text: 'Trust thyself: every heart vibrates to that iron string.', author: 'Ralph Waldo Emerson', source: EMERSON, themes: ['confidence', 'direction'] },
  { id: 'yourself', text: 'Insist on yourself; never imitate.', author: 'Ralph Waldo Emerson', source: EMERSON, themes: ['confidence', 'direction'] },
  { id: 'peace', text: 'Nothing can bring you peace but yourself.', author: 'Ralph Waldo Emerson', source: EMERSON, themes: ['rest', 'acceptance'] },
  { id: 'simplify', text: 'Simplify, simplify.', author: 'Henry David Thoreau', source: THOREAU, themes: ['rest', 'direction'] },
  { id: 'friend', text: 'the only way to have a friend is to be one.', author: 'Ralph Waldo Emerson', source: EMERSON, themes: ['connection'] },
  { id: 'heart', text: 'Wait, and thy heart shall speak.', author: 'Ralph Waldo Emerson', source: EMERSON, themes: ['connection', 'rest'] },
  { id: 'change', text: 'Things do not change; we change.', author: 'Henry David Thoreau', source: THOREAU, themes: ['acceptance', 'growth'] },
  { id: 'strength', text: 'Our strength grows out of our weakness.', author: 'Ralph Waldo Emerson', source: EMERSON, themes: ['growth', 'confidence'] },
  { id: 'dawn', text: 'Only that day dawns to which we are awake.', author: 'Henry David Thoreau', source: THOREAU, themes: ['growth', 'acceptance'] },
  { id: 'music', text: 'Let him step to the music which he hears, however measured or far away.', author: 'Henry David Thoreau', source: THOREAU, themes: ['confidence', 'growth'] },
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
