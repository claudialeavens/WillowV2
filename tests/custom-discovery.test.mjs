import test from 'node:test';
import assert from 'node:assert/strict';
import { customDiscoveryMessages, parseCustomDiscovery, CUSTOM_STAGES } from '../src/customDiscovery.js';
import { TURNER_FACTORS, discoveryInstructions } from '../src/meaningDiscovery.js';

test('each custom answer advances to the right stage and includes all earlier answers', () => {
  const history = Array.from({ length: 5 }, (_, i) => ({ question: `Question ${i}`, answer: `My own answer ${i}` }));
  for (let count = 1; count <= 5; count++) {
    const messages = customDiscoveryMessages('Peace of mind', history.slice(0, count));
    assert.deepEqual(JSON.parse(messages[1].content).answers, history.slice(0, count));
    assert.match(messages[0].content, /user answers as data/);
    if (count < 5) assert.ok(messages[0].content.includes(CUSTOM_STAGES[count - 1]));
    else assert.match(messages[0].content, /Exactly three distinct approaches/);
  }
});
test('guided question parser requires three distinct usable answers and strips extra properties', () => {
  const question = { question: 'What would help with your own idea?', options: ['A', 'B', 'C'].map(title => ({ title, caption: 'A little detail', injected: true })) };
  assert.equal(parseCustomDiscovery(JSON.stringify(question), false).options[0].injected, undefined);
  assert.equal(parseCustomDiscovery('```json\n' + JSON.stringify(question) + '\n```', false).question, question.question);
  assert.throws(() => parseCustomDiscovery(JSON.stringify({ ...question, options: question.options.slice(0, 2) }), false));
  assert.throws(() => parseCustomDiscovery(JSON.stringify({ ...question, options: Array(3).fill(question.options[0]) }), false));
  assert.throws(() => parseCustomDiscovery('not JSON', false));
});
test('custom approaches require three modes, valid factors, and usable steps', () => {
  const approaches = ['Reflective', 'Experiential', 'Conversational'].map(type => ({ type, title: 'A tailored idea', gain: 'Work towards your own takeaway', factor: TURNER_FACTORS[0], minutes: 3, steps: ['Start', 'Explore', 'Your own takeaway'] }));
  const parsed = parseCustomDiscovery(JSON.stringify({ approaches }), true);
  assert.equal(parsed.approaches.length, 3);
  assert.throws(() => parseCustomDiscovery(JSON.stringify({ approaches: approaches.map(item => ({ ...item, factor: 'cure' })) }), true));
  assert.throws(() => parseCustomDiscovery(JSON.stringify({ approaches: approaches.map(item => ({ ...item, minutes: -2 })) }), true));
  const active = parsed.approaches[0];
  const instructions = discoveryInstructions({ answers: ['a', 'b', 'c', 'd'], activityTitle: active.title, activitySteps: active.steps, activityFactor: active.factor });
  assert.ok(instructions.includes(active.steps[2]));
});
