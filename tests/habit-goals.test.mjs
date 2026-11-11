import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteHabitGoal, habitGoals, saveHabitGoal, toggleGoalDay } from '../src/habitGoals.js';
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

test('account menu descriptions use at most three words', async () => {
  const { shortGoalTitle } = await import('../src/habitGoals.js');
  assert.equal(shortGoalTitle('  Daily   morning walk outside '), 'Daily morning walk');
  assert.equal(shortGoalTitle('Meditation'), 'Meditation');
});

test('deleting an additional goal preserves other names, check-ins, and notes', () => {
  const added = saveHabitGoal(original, { id: 'walk', title: 'Walk' });
  const removed = deleteHabitGoal(added, 'walk');
  assert.deepEqual(habitGoals(removed), habitGoals(original));
  assert.equal(removed.note, original.note);
  assert.equal(added.goals.length, 1);
});
test('deleting the primary goal stays deleted after saving and reloading', () => {
  const added = toggleGoalDay(saveHabitGoal(original, { id: 'walk', title: 'Walk' }), 'walk', '2026-11-3');
  const removed = JSON.parse(JSON.stringify(deleteHabitGoal(added, 'primary')));
  assert.deepEqual(habitGoals(removed), added.goals);
  assert.deepEqual(removed.days, []);
  assert.equal(removed.intention, original.intention);
  assert.deepEqual(habitGoals(deleteHabitGoal(removed, 'walk')), []);
  assert.equal(habitGoals(saveHabitGoal(deleteHabitGoal(removed, 'walk'), { id: 'new', title: 'Read' })).length, 1);
});
