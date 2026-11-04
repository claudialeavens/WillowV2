import test from 'node:test';
import assert from 'node:assert/strict';
import { habitGoals, saveHabitGoal, toggleGoalDay } from '../src/habitGoals.js';
const original = { title: 'Movement', intention: 'Feel good', days: ['2026-11-2'], note: 'More energy' };
test('existing habit and check-ins remain the first goal', () => {
  assert.deepEqual(habitGoals(original), [{ id: 'primary', title: 'Movement', days: ['2026-11-2'] }]);
});
test('new goals start empty and check-ins stay independent', () => {
  const added = saveHabitGoal(original, { id: 'walk', title: ' Walking ' });
  const checked = toggleGoalDay(added, 'walk', '2026-11-3');
  assert.deepEqual(checked.days, original.days);
  assert.deepEqual(checked.goals[0], { id: 'walk', title: 'Walking', days: ['2026-11-3'] });
  assert.deepEqual(toggleGoalDay(checked, 'walk', '2026-11-3').goals[0].days, []);
  assert.equal(original.goals, undefined);
});
test('renaming either goal preserves its check-ins', () => {
  const added = saveHabitGoal(original, { id: 'walk', title: 'Walk' });
  const checked = toggleGoalDay(added, 'walk', '2026-11-3');
  const renamed = saveHabitGoal(checked, { id: 'walk', title: 'Evening walk' });
  assert.deepEqual(renamed.goals[0].days, ['2026-11-3']);
  assert.deepEqual(saveHabitGoal(renamed, { id: 'primary', title: 'Exercise' }).days, original.days);
  assert.equal(saveHabitGoal(renamed, { id: 'walk', title: '  ' }), renamed);
});
