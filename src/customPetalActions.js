import { PETAL_NAMES } from './petalRecommendations.js';
export function customPetalActions(preferences) {
  return (preferences?.custom ?? []).filter(item => PETAL_NAMES.includes(item.petal)).map(item => ({ ...item, role: 'custom', sourceTitle: 'Your custom action item' }));
}
export function addCustomPetalAction(preferences, petal, text, id) {
  const value = text.trim();
  if (!value || value.length > 500 || !PETAL_NAMES.includes(petal)) return preferences;
  return { ...preferences, dismissed: preferences?.dismissed ?? [], custom: [...(preferences?.custom ?? []), { id, petal, text: value }] };
}
export function editPetalAction(preferences, id, text) {
  const value = text.trim();
  if (!value || value.length > 500) return preferences;
  return { ...preferences, dismissed: preferences?.dismissed ?? [], edits: { ...(preferences?.edits ?? {}), [id]: value } };
}
export function applyPetalEdits(items, preferences) {
  return items.map(item => {
    const text = preferences?.edits?.[item.id];
    return typeof text === 'string' && text.trim() ? { ...item, originalText: item.text, text } : item;
  });
}
export function actionCompletionCount(preferences, id) {
  const value = preferences?.completions?.[id];
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
export function changeActionCompletion(preferences, id, delta) {
  if (!Number.isSafeInteger(delta)) return preferences;
  const count = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, actionCompletionCount(preferences, id) + delta));
  return { ...preferences, dismissed: preferences?.dismissed ?? [], completions: { ...(preferences?.completions ?? {}), [id]: count } };
}
