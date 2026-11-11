import test from 'node:test';
import assert from 'node:assert/strict';
import { DISCOVERY_PATHS, DISCOVERY_ACTIVITIES, TURNER_FACTORS, recommendedActivities, discoveryInstructions } from '../src/meaningDiscovery.js';

test('all six entry choices have relatable starting points and exactly three suggestions', () => {
  assert.equal(Object.keys(DISCOVERY_PATHS).length, 6);
  for (const [choice, path] of Object.entries(DISCOVERY_PATHS)) {
    assert.ok(path.heading && path.intro);
    assert.ok(path.intents.length >= 3 && path.intents.length <= 4);
    path.intents.forEach((intent, index) => {
      const suggestions = recommendedActivities(choice, index);
      assert.equal(suggestions.length, 3, `${choice}: ${intent.title}`);
      assert.equal(suggestions[0].id, intent.primary);
      assert.equal(new Set(suggestions.map((item) => item.id)).size, 3);
    });
  }
});
test('every pursuit has useful steps, a duration, a benefit, and a Turner factor', () => {
  for (const item of Object.values(DISCOVERY_ACTIVITIES)) {
    assert.ok(TURNER_FACTORS.includes(item.factor));
    assert.ok(item.minutes >= 2 && item.minutes <= 5);
    assert.equal(item.steps.length, 3);
    assert.ok(item.title && item.gain && item.type);
  }
});
test('chat carries the chosen need and activity forward without another intake', () => {
  const context = { need: 'Meaning & purpose', intent: 'Find a sense of direction', activityId: 'intuition', stage: 'reflect' };
  const instructions = discoveryInstructions(context);
  assert.match(instructions, /Find a sense of direction/);
  assert.match(instructions, /Listen for your own yes/);
  assert.match(instructions, /Following your intuition/);
  assert.match(instructions, /at most one or two/);
  assert.match(instructions, /never as treatments, cures, or guarantees/);
  assert.equal(discoveryInstructions(null), '');
});
test('suggestions offer different ways to engage rather than a single repeated exercise', () => {
  for (const [choice, path] of Object.entries(DISCOVERY_PATHS)) {
    const firsts = path.intents.map((_, index) => recommendedActivities(choice, index)[0].id);
    assert.ok(new Set(firsts).size >= 2);
    path.intents.forEach((_, index) => assert.ok(new Set(recommendedActivities(choice, index).map((item) => item.type)).size >= 2));
  }
});
