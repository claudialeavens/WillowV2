const ENCOURAGEMENT = {
  'Feeling connected': 'Make a little room for connection',
  'Energy & vitality': 'Give your energy a little care',
  'Joy & enjoyment': 'Make space for a spark of joy',
  'Peace of mind': 'Give yourself a moment of peace',
  'Meaning & purpose': 'Take one small step toward what matters',
  'Managing everyday life': 'Lighten your day, one small step at a time',
};
export function nextPetalAction(items, previousId) {
  if (!items.length) return null;
  const previous = items.findIndex(item => item.id === previousId);
  return items[(previous + 1) % items.length];
}
export function inspirePetalAction(item) {
  if (!item) return 'Your saved action items will appear here.';
  return `${ENCOURAGEMENT[item.petal] ?? 'Take one small step for yourself'}: ${item.text}`;
}
export function selectMenuPetalAction(items, previousId, rotation) {
  if (rotation?.paused) {
    const pinned = items.find(item => item.id === rotation.itemId);
    if (pinned) return pinned;
  }
  return nextPetalAction(items, previousId);
}
