import test from 'node:test';
import assert from 'node:assert/strict';
import { DISCOVERY_PATHS, TURNER_FACTORS, discoveryInstructions } from '../src/meaningDiscovery.js';
import { discoveryFollowUp, tailoredActivity } from '../src/discoveryQuestions.js';

test('all six paths offer two answer-dependent follow-up questions', () => {
  assert.equal(Object.keys(DISCOVERY_PATHS).length, 6);
  for (const [choice, path] of Object.entries(DISCOVERY_PATHS)) {
    path.intents.forEach((intent, index) => {
      const first = discoveryFollowUp(choice, index);
      assert.ok(first.question && first.options.length === 3, `${choice}: ${intent.title}`);
      first.options.forEach((answer, needIndex) => {
        const second = discoveryFollowUp(choice, index, needIndex);
        assert.ok(second.question && second.options.length === 3, answer.title);
        second.options.forEach((_, fitIndex) => {
          const result = tailoredActivity(choice, index, needIndex, fitIndex);
          assert.ok(result.title && result.gain && result.minutes);
          assert.ok(TURNER_FACTORS.includes(result.factor));
          assert.equal(result.steps.length, 3);
        });
      });
    });
  }
});
test('no activity is recommended until both additional questions are answered', () => {
  assert.equal(tailoredActivity('Meaning & purpose', 0, null, null), null);
  assert.equal(tailoredActivity('Meaning & purpose', 0, 0, null), null);
  assert.equal(tailoredActivity('Meaning & purpose', 0, null, 0), null);
});
test('changing the first answer changes the second question and matching activity', () => {
  const first = discoveryFollowUp('Meaning & purpose', 0, 0);
  const different = discoveryFollowUp('Meaning & purpose', 0, 1);
  assert.notEqual(first.question, different.question);
  assert.notEqual(tailoredActivity('Meaning & purpose', 0, 0, 0).id, tailoredActivity('Meaning & purpose', 0, 1, 0).id);
});
test('changing the second answer tailors the activity title and actual first step', () => {
  const first = tailoredActivity('Meaning & purpose', 0, 0, 0);
  const different = tailoredActivity('Meaning & purpose', 0, 0, 1);
  assert.notEqual(first.title, different.title);
  assert.notEqual(first.steps[0], different.steps[0]);
  assert.equal(first.factor, different.factor);
});
test('chat receives both answers and tailored steps without repeating discovery', () => {
  const result = tailoredActivity('Meaning & purpose', 0, 0, 1);
  const instructions = discoveryInstructions({ need: 'Meaning & purpose', answers: ['Remembering what has felt fulfilling', 'Something I used to enjoy'], activityId: result.id, activityTitle: result.title, activitySteps: result.steps });
  assert.match(instructions, /already answered both/);
  assert.ok(instructions.includes(result.steps[0]));
  assert.match(instructions, /never as treatments, cures, or guarantees/);
  assert.equal(discoveryInstructions(null), '');
});
test('chat mid-discovery only asks the remaining number of follow-up questions', () => {
  assert.match(discoveryInstructions({ need: 'Peace of mind', answers: [] }), /at most 2 more/);
  assert.match(discoveryInstructions({ need: 'Peace of mind', answers: ['Less mental noise'] }), /at most 1 more/);
});
