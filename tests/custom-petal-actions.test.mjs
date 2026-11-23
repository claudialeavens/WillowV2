import test from 'node:test';
import assert from 'node:assert/strict';
import { addCustomPetalAction, customPetalActions, editPetalAction, applyPetalEdits, actionCompletionCount, changeActionCompletion } from '../src/customPetalActions.js';
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

test('edits archived and custom text without changing the original source or hidden state',()=>{
 const original={id:'archive:one',text:'Reply to emails.',petal:'Managing everyday life',record:{title:'Original conversation'}};
 const before={dismissed:['hidden'],custom:[{id:'custom:one',petal:'Feeling connected',text:'Call Mum'}]};
 const after=editPetalAction(before,original.id,'  Reply to important emails  ');
 const edited=applyPetalEdits([original],after)[0];
 assert.equal(edited.text,'Reply to important emails');
 assert.equal(edited.originalText,'Reply to emails.');
 assert.equal(original.text,'Reply to emails.');
 assert.equal(edited.record,original.record);
 assert.deepEqual(after.dismissed,before.dismissed);
 assert.deepEqual(after.custom,before.custom);
 assert.equal(applyPetalEdits(customPetalActions(editPetalAction(after,'custom:one','Call Mum on Sunday')),editPetalAction(after,'custom:one','Call Mum on Sunday'))[0].text,'Call Mum on Sunday');
});
test('rejects blank and oversized edits',()=>{
 const before={dismissed:[]};
 assert.equal(editPetalAction(before,'one','   '),before);
 assert.equal(editPetalAction(before,'one','a'.repeat(501)),before);
});

test('counts repeat completions and allows undoing down to zero',()=>{
 const original={dismissed:['hidden'],edits:{one:'Updated action'},custom:[{id:'custom:one',text:'Walk',petal:'Energy & vitality'}]};
 let value=original;
 assert.equal(actionCompletionCount(value,'one'),0);
 for(let count=1;count<=3;count++){value=changeActionCompletion(value,'one',1);assert.equal(actionCompletionCount(value,'one'),count);}
 assert.deepEqual(value.custom,original.custom);
 assert.deepEqual(value.edits,original.edits);
 assert.deepEqual(value.dismissed,original.dismissed);
 assert.equal(original.completions,undefined);
 for(let count=2;count>=0;count--){value=changeActionCompletion(value,'one',-1);assert.equal(actionCompletionCount(value,'one'),count);}
 assert.equal(actionCompletionCount(changeActionCompletion(value,'one',-1),'one'),0);
 assert.equal(changeActionCompletion(value,'one',0.5),value);
});
test('completion counts stay attached when the action text is edited',()=>{
 const value=editPetalAction(changeActionCompletion({dismissed:[]},'one',1),'one','Revised action');
 assert.equal(actionCompletionCount(value,'one'),1);
 assert.equal(actionCompletionCount(value,'two'),0);
});
