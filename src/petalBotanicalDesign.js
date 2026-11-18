const THEMES = {
  'Feeling connected': { label: 'Connection', hue: 28, leafHue: 86, flowerHue: 32 },
  'Energy & vitality': { label: 'Energy & vitality', hue: 88, leafHue: 99, flowerHue: 48 },
  'Joy & enjoyment': { label: 'Joy & enjoyment', hue: 46, leafHue: 83, flowerHue: 40 },
  'Peace of mind': { label: 'Peace of mind', hue: 278, leafHue: 125, flowerHue: 277 },
  'Meaning & purpose': { label: 'Meaning & purpose', hue: 23, leafHue: 85, flowerHue: 20 },
  'Managing everyday life': { label: 'Everyday life', hue: 185, leafHue: 145, flowerHue: 192 },
};
let fallbackSequence = 0;
export function reserveBotanicalSeed(storage = localStorage) {
  try {
    const key = 'willow-botanical-sequence-v1';
    const next = BigInt(storage.getItem(key) ?? '0') + 1n;
    storage.setItem(key, String(next));
    return String(next);
  } catch { return `${Date.now()}-${++fallbackSequence}-${Math.random()}`; }
}
export function botanicalDesign(petal, seed) {
  const theme = THEMES[petal] ?? THEMES['Meaning & purpose'];
  let hash = 2166136261;
  for (const char of String(seed)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  let state = hash >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const branches = Array.from({ length: 3 }, (_, branch) => {
    const startX = 82 + branch * 25 + random() * 15;
    const bend = 18 + random() * 50;
    const leaves = Array.from({ length: 9 + Math.floor(random() * 6) }, (_, index) => {
      const y = 8 + index * 9 + random() * 5;
      return { x: startX + Math.sin(y / 75) * bend - bend / 2, y, angle: (index % 2 ? 40 : -55) + random() * 35, length: 16 + random() * 19, width: 4 + random() * 7, hue: theme.leafHue + random() * 20 - 10, light: 35 + random() * 27 };
    });
    return { path: `M${startX} -10 Q${startX - bend} 65 ${startX + bend / 3} 160`, leaves };
  });
  const flowers = Array.from({ length: 3 + Math.floor(random() * 5) }, () => ({ x: 57 + random() * 95, y: 12 + random() * 125, radius: 4 + random() * 5, petals: 5 + Math.floor(random() * 3), rotation: random() * 360 }));
  return { ...theme, hue: theme.hue + random() * 8 - 4, branches, flowers };
}
