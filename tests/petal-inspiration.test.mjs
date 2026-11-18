import test from 'node:test';
import assert from 'node:assert/strict';
import { nextPetalAction, inspirePetalAction } from '../src/petalInspiration.js';
const items = [{id:'one',text:'Call Mum.',petal:'Feeling connected'},{id:'two',text:'Reply to emails.',petal:'Managing everyday life'},{id:'three',text:'Take a walk.',petal:'Energy & vitality'}];
test('rotates through every action before repeating',()=>{
 let previous=null;
 const sequence=Array.from({length:7},()=>{const next=nextPetalAction(items,previous);previous=next.id;return next.id;});
 assert.deepEqual(sequence,['one','two','three','one','two','three','one']);
});
test('handles hidden or deleted previous items, one item, and an empty archive',()=>{
 assert.equal(nextPetalAction(items.slice(1),'one').id,'two');
 assert.equal(nextPetalAction([items[0]],'one').id,'one');
 assert.equal(nextPetalAction([],null),null);
});
test('fallback encouragement retains the actual action without inventing details',()=>{
 assert.equal(inspirePetalAction(items[0]),'Make a little room for connection: Call Mum.');
 assert.ok(inspirePetalAction(items[1]).endsWith('Reply to emails.'));
 assert.equal(inspirePetalAction(null),'Your saved action items will appear here.');
});
