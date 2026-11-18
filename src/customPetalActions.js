import { PETAL_NAMES } from './petalRecommendations.js';
export function customPetalActions(preferences) {
  return (preferences?.custom ?? []).filter(item => PETAL_NAMES.includes(item.petal)).map(item => ({ ...item, role: 'custom', sourceTitle: 'Your custom action item' }));
}
export function addCustomPetalAction(preferences, petal, text, id) {
  const value = text.trim();
  if (!value || value.length > 500 || !PETAL_NAMES.includes(petal)) return preferences;
  return { ...preferences, dismissed: preferences?.dismissed ?? [], custom: [...(preferences?.custom ?? []), { id, petal, text: value }] };
}
