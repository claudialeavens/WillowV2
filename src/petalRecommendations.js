export const PETAL_NAMES = ['Feeling connected', 'Energy & vitality', 'Joy & enjoyment', 'Peace of mind', 'Meaning & purpose', 'Managing everyday life'];
const TOPICS = [
  /\b(friend\w*|family|partner|connect\w*|call|reach out|relationship\w*|someone|together)\b/gi,
  /\b(walk\w*|movement|exercise|sleep|bed|bedtime|meal\w*|food|body|stretch\w*|workout|nourish\w*)\b/gi,
  /\b(joy|enjoy\w*|fun|play|music|hobby|hobbies|outside|nature|beauty|creative)\b/gi,
  /\b(breath\w*|meditat\w*|journal\w*|calm|peace|pause|let go|quiet|rest|mindful\w*|worry|worries)\b/gi,
  /\b(purpose|meaning\w*|value\w*|reflect\w*|dream\w*|growth|learn\w*|big goal)\b/gi,
  /\b(email\w*|inbox|appointment\w*|organiz\w*|organis\w*|task\w*|list|work|deadline\w*|plan\w*|schedule|finish|book|priorit\w*|bill\w*|clean\w*)\b/gi,
];
const ACTION = /^(?:(?:you (?:could|can|might)|try(?: to)?|consider|let’s|let us|i(?:’ll|'ll| will| plan to| want to| intend to| could| can| might))\s+)?(?:take|make|plan|schedule|prepare|go|walk|move|stretch|call|text|send|reach|reply|finish|finalize|finalise|book|write|journal|reflect|practice|practise|pause|breathe|meditate|set|choose|pick|spend|notice|listen|read|start|begin|break|clear|organize|organise|sort|list|prioritize|prioritise|do|let go|put|turn|try|create|learn|ask|get|eat|sleep|aim|return|focus)\b/i;
const EXCLUDE = /\b(?:already|finished|completed|done|yesterday|used to|no longer|don’t|don't|do not|won’t|won't|can't|cannot|not to|not going to|stop taking)\b/i;
export function classifyPetal(text, selection) {
  const scores = TOPICS.map(pattern => (text.match(pattern) ?? []).length);
  const best = Math.max(...scores);
  if (!best) return PETAL_NAMES.includes(selection) ? selection : 'Managing everyday life';
  const matching = scores.map((score, index) => score === best ? index : -1).filter(index => index >= 0);
  const preferred = PETAL_NAMES.indexOf(selection);
  return PETAL_NAMES[matching.includes(preferred) ? preferred : matching[0]];
}
export function archiveRecommendations(records, userId) {
  const seen = new Set();
  const items = [];
  for (const record of [...records].filter(record => record.user_id === (userId ?? null)).sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? '')))) {
    if (record.summary?.kind === 'activity') continue;
    const sources = [
      ...(record.summary?.takeaway ? [{ content: record.summary.takeaway, role: 'takeaway' }] : []),
      ...(record.messages ?? []).filter(message => ['user', 'assistant'].includes(message.role)),
    ];
    for (const source of sources) {
      const lines = String(source.content ?? '').split(/\n+|(?<=[.!?])\s+/);
      for (const line of lines) {
        const text = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/\*\*/g, '').replace(/^(?:your )?(?:next step|action item|small step|recommendation)\s*:\s*/i, '').trim();
        if (text.length < 12 || text.length > 260 || /\?$/.test(text) || EXCLUDE.test(text) || !ACTION.test(text)) continue;
        const key = text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ id: `${record.id}:${key}`, text, petal: classifyPetal(text, record.summary?.selection), sourceId: record.id, sourceTitle: record.title || 'Saved conversation', role: source.role, record });
      }
    }
  }
  return items;
}
