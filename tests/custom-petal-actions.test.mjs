import test from 'node:test';
import assert from 'node:assert/strict';
import { addCustomPetalAction, customPetalActions } from '../src/customPetalActions.js';
test('adds a custom item to its chosen petal while preserving existing items and hidden IDs',()=>{
 const before={dismissed:['archive:one'],custom:[{id:'existing',petal:'Feeling connected',text:'Call Mum'}]};
 const after=addCustomPetalAction(before,'Meaning & purpose','  Reflect on my priorities  ','custom:two');
 assert.deepEqual(after.dismissed,before.dismissed);
 assert.equal(after.custom.length,2);
 assert.deepEqual(after.custom[1],{id:'custom:two',petal:'Meaning & purpose',text:'Reflect on my priorities'});
 assert.equal(before.custom.length,1);
 assert.equal(customPetalActions(after)[1].sourceTitle,'Your custom action item');
});
test('rejects empty or oversized text and invalid petals',()=>{
 const before={dismissed:[]};
 assert.equal(addCustomPetalAction(before,'Peace of mind','   ','one'),before);
 assert.equal(addCustomPetalAction(before,'Peace of mind','a'.repeat(501),'one'),before);
 assert.equal(addCustomPetalAction(before,'unknown','Read a book','one'),before);
 assert.deepEqual(customPetalActions(before),[]);
});
