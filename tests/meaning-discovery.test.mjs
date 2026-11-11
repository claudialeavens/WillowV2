import test from 'node:test';
import assert from 'node:assert/strict';
import { DISCOVERY_PATHS, TURNER_FACTORS, discoveryInstructions } from '../src/meaningDiscovery.js';
import { discoveryFollowUp, sessionOutcomeQuestion, sessionTakeawayQuestion, tailoredActivity } from '../src/discoveryQuestions.js';

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
          const result = tailoredActivity(choice, index, needIndex, fitIndex, 0, 0);
          assert.ok(result.title && result.gain && result.minutes);
          assert.ok(TURNER_FACTORS.includes(result.factor));
          assert.equal(result.steps.length, 3);
        });
      });
    });
  }
});
test('no activity is recommended until all four follow-up questions are answered', () => {
  assert.equal(tailoredActivity('Meaning & purpose', 0, null, null), null);
  assert.equal(tailoredActivity('Meaning & purpose', 0, 0, null), null);
  assert.equal(tailoredActivity('Meaning & purpose', 0, null, 0), null);
});
test('changing the first answer changes the second question and matching activity', () => {
  const first = discoveryFollowUp('Meaning & purpose', 0, 0);
  const different = discoveryFollowUp('Meaning & purpose', 0, 1);
  assert.notEqual(first.question, different.question);
  assert.notEqual(tailoredActivity('Meaning & purpose', 0, 0, 0, 0, 0).id, tailoredActivity('Meaning & purpose', 0, 1, 0, 0, 0).id);
});
test('changing the second answer tailors the activity title and actual first step', () => {
  const first = tailoredActivity('Meaning & purpose', 0, 0, 0, 0, 0);
  const different = tailoredActivity('Meaning & purpose', 0, 0, 1, 0, 0);
  assert.notEqual(first.title, different.title);
  assert.notEqual(first.steps[0], different.steps[0]);
  assert.equal(first.factor, different.factor);
});
test('chat receives both answers and tailored steps without repeating discovery', () => {
  const result = tailoredActivity('Meaning & purpose', 0, 0, 1, 0, 0);
  const instructions = discoveryInstructions({ need: 'Meaning & purpose', answers: ['Remembering what has felt fulfilling', 'Something I used to enjoy', 'Understand what I need more clearly', 'A sentence that names what matters'], activityId: result.id, activityTitle: result.title, activitySteps: result.steps });
  assert.match(instructions, /already answered all four/);
  assert.ok(instructions.includes(result.steps[0]));
  assert.match(instructions, /never as treatments, cures, or guarantees/);
  assert.equal(discoveryInstructions(null), '');
});
test('chat mid-discovery only asks the remaining number of follow-up questions', () => {
  assert.match(discoveryInstructions({ need: 'Peace of mind', answers: [] }), /at most 4 more/);
  assert.match(discoveryInstructions({ need: 'Peace of mind', answers: ['Less mental noise'] }), /at most 3 more/);
});

test('hopes change the final question and takeaway changes the activity finish', () => {
  for (const [choice, path] of Object.entries(DISCOVERY_PATHS)) {
    path.intents.forEach((_, intentIndex) => {
      discoveryFollowUp(choice, intentIndex).options.forEach((_, needIndex) => {
        discoveryFollowUp(choice, intentIndex, needIndex).options.forEach((_, fitIndex) => {
          const args = [choice, intentIndex, needIndex, fitIndex];
          assert.equal(tailoredActivity(...args), null);
          assert.equal(tailoredActivity(...args, 0), null);
          const third = sessionOutcomeQuestion(...args);
          assert.equal(third.options.length, 3);
          const questions = third.options.map((_, outcomeIndex) => {
            const fourth = sessionTakeawayQuestion(...args, outcomeIndex);
            assert.equal(fourth.options.length, 3);
            const finishes = fourth.options.map((takeaway, takeawayIndex) => {
              const activity = tailoredActivity(...args, outcomeIndex, takeawayIndex);
              assert.equal(activity.desiredTakeaway, takeaway.title);
              assert.ok(activity.gain.includes(takeaway.title.toLowerCase()));
              assert.ok(TURNER_FACTORS.includes(activity.factor));
              return activity.steps[2];
            });
            assert.equal(new Set(finishes).size, 3);
            return fourth.question;
          });
          assert.equal(new Set(questions).size, 3);
        });
      });
    });
  }
});
test('chat after three answers asks only for the missing takeaway', () => {
  const instructions = discoveryInstructions({ answers: ['need', 'fit', 'hope'], hopedOutcome: 'A way forward' });
  assert.match(instructions, /at most 1 more/);
  assert.match(instructions, /do not ask again/);
  assert.match(instructions, /closing reflection/);
});
