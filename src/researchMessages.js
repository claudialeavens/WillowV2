const emotional = 'https://www.nih.gov/health-information/your-healthiest-self-wellness-toolkits/emotional-wellness-toolkit';
const mindfulness = 'https://www.nccih.nih.gov/health/stress';
const messages = {
  'Feeling connected': {
    text: 'Research links meaningful relationships and social support with wellbeing, resilience, and overall health.',
    source: 'https://newsinhealth.nih.gov/2025/03/build-social-bonds-protect-health',
    theme: 'Finding social support',
  },
  'Energy & vitality': {
    text: 'Research links regular physical activity with better physical and emotional wellbeing.',
    source: 'https://www.niddk.nih.gov/health-information/weight-management/keep-active-eat-healthy-feel-great',
    theme: 'Increasing exercise and movement',
  },
  'Peace of mind': {
    text: 'Research suggests that mindfulness practices may help reduce stress and anxiety symptoms.',
    source: mindfulness, theme: 'Emotional wellbeing',
  },
  'Joy & enjoyment': {
    text: 'Research suggests that positive emotions and a positive outlook can support emotional wellbeing and health.',
    source: 'https://newsinhealth.nih.gov/2015/08/positive-emotions-your-health',
    theme: 'Increasing positive emotions',
  },
  'Meaning & purpose': {
    text: 'Research identifies meaning, purpose, and pursuing personally valued goals as important parts of emotional wellbeing.',
    source: 'https://www.nia.nih.gov/news/nih-networks-advance-emotional-well-being-research',
    theme: 'Finding strong reasons for living',
  },
};

// Curated sources keep the closing page grounded in published information.
// The takeaway reflects the agreed direction; opening menu choices are only a fallback.
const topics = [
  {
    pattern: /\b(nutrition|nutritious|diet|food|eat(?:ing)?|meals?|snacks?|fruits?|apples?|vegetables?|protein|nut butter|whole grains?)\b/gi,
    message: {
      text: 'Healthy eating patterns that include fruit, vegetables, whole grains, and protein provide nutrients your body needs for wellbeing.',
      source: 'https://www.niddk.nih.gov/health-information/weight-management/healthy-eating-physical-activity-for-life/health-tips-for-adults',
      theme: 'Radically changing your diet',
      tip: 'Let a nourishing food choice that feels manageable be a starting point.',
    },
  },
  { pattern: /\b(walk(?:ing)?|exercis(?:e|ing)|movement|physical activity|danc(?:e|ing)|swim(?:ming)?|stretch(?:ing)?|cycling)\b/gi, message: messages['Energy & vitality'] },
  { pattern: /\b(friends?|family|relationships?|social|connect(?:ion|ed|ing)?|lonel(?:y|iness)|support network)\b/gi, message: messages['Feeling connected'] },
  { pattern: /\b(joy|gratitude|grateful|enjoy(?:ment|ing)?|laughter|positive emotions|happiness)\b/gi, message: messages['Joy & enjoyment'] },
  { pattern: /\b(purpose|meaning|reasons? for living|valued goals|calling)\b/gi, message: messages['Meaning & purpose'] },
  {
    pattern: /\b(meditat(?:e|ion|ing)|spiritual(?:ity)?|prayer|faith|mindfulness)\b/gi,
    message: { ...messages['Peace of mind'], theme: 'Deepening your spiritual connection' },
  },
  {
    pattern: /\b(grief|grieving|anger|resentment|forgiv(?:e|eness|ing)|journal(?:ing)?|releas(?:e|ing) emotions|suppressed emotions|stress|anxiety|grounding|breathing)\b/gi,
    message: { ...messages['Peace of mind'], theme: 'Releasing suppressed emotions' },
  },
  {
    pattern: /\b(intuition|inner voice|gut feeling|inner wisdom|instincts?)\b/gi,
    message: { text: 'Noticing your feelings and reflecting on what matters to you are part of emotional wellbeing.', source: emotional, theme: 'Following your intuition' },
  },
  {
    pattern: /\b(empower(?:ed|ment)?|taking control|health decisions|self.advocacy|advocat(?:e|ing)|agency)\b/gi,
    message: { text: 'Reflecting on your priorities can help you take an active role in decisions about your health.', source: 'https://www.nia.nih.gov/health/medical-care-and-appointments/talking-your-doctor', theme: 'Taking control of your health' },
  },
  {
    pattern: /\b(supplements?|herbs?|herbal|vitamins?)\b/gi,
    message: { text: 'Research on supplements varies by product; checking evidence and possible medicine interactions can support informed choices.', source: 'https://www.nccih.nih.gov/health/using-dietary-supplements-wisely', theme: 'Using herbs and supplements' },
  },
];

const matchTopic = (text) => {
  let best;
  let highestScore = 0;
  for (const { pattern, message } of topics) {
    const score = new Set((text.match(pattern) ?? []).map((word) => word.toLowerCase())).size;
    if (score > highestScore) {
      highestScore = score;
      best = message;
    }
  }
  return best;
};

export const getResearchMessage = (context, conversation = [], takeaway = '') => {
  // Prefer the closing insight, then recent user messages. Assistant menus can
  // mention several paths the user never chose, so they do not drive matching.
  const matched = matchTopic(takeaway) ?? conversation
    .filter((message) => message.role === 'user')
    .slice().reverse()
    .map((message) => matchTopic(message.content ?? ''))
    .find(Boolean);
  if (matched) return matched;
  if (context?.activity === 'Grounding') return messages['Peace of mind'];
  // Energy alone does not establish whether food, movement, or another factor fits.
  return (context?.selection !== 'Energy & vitality' && messages[context?.selection]) || {
    text: 'Research on emotional wellbeing considers our feelings, relationships, sense of purpose, and personally meaningful goals.',
    source: emotional, theme: 'Taking control of your health',
  };
};

export const TURNER_THEMES_SOURCE = 'https://www.radicalremission.com/podcast';
