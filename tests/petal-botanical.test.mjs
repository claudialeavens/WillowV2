import test from 'node:test';
import assert from 'node:assert/strict';
import { botanicalDesign, reserveBotanicalSeed } from '../src/petalBotanicalDesign.js';
test('reserves fresh artwork across component remounts and sessions', () => {
 const data=new Map(); const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 const seeds=Array.from({length:1000},()=>reserveBotanicalSeed(storage));
 assert.equal(new Set(seeds).size,1000);
 assert.equal(reserveBotanicalSeed(storage),'1001');
 assert.equal(new Set(seeds.map(seed=>JSON.stringify(botanicalDesign('Feeling connected',seed)))).size,1000);
});
test('uses a distinct appropriate palette for each petal',()=>{
 const names=['Feeling connected','Energy & vitality','Joy & enjoyment','Peace of mind','Meaning & purpose','Managing everyday life'];
 assert.equal(new Set(names.map(name=>botanicalDesign(name,'1').hue)).size,6);
 for(const name of names){const design=botanicalDesign(name,'1');assert.ok(design.label);assert.ok(design.branches.length);assert.ok(design.flowers.length);}
});
test('unavailable browser storage still yields fresh artwork seeds',()=>{
 const storage={getItem:()=>{throw Error('blocked');}};
 assert.notEqual(reserveBotanicalSeed(storage),reserveBotanicalSeed(storage));
});
