import test from 'node:test';
import assert from 'node:assert/strict';
import {gaugePlacement} from '../backgauge-placement.js';
import {EXAMPLE,stage} from '../engine.js';
import {technicalScene} from '../technical-section.js';

test('el apoyo se sitúa sobre el extremo trasero de la chapa, no a X fija',()=>{
 const scene={sheetDisplay:[{x:-100,y:1},{x:0,y:1},{x:75,y:1}],
  die:{opening:16},piece:{thickness:2}};
 const a=gaugePlacement(scene,1),b=gaugePlacement(scene,2);
 assert.deepEqual(a.point,{x:75,y:1});
 assert.equal(a.profile,'stop');assert.equal(b.profile,'support');
 assert.deepEqual(a.point,b.point);
 assert.equal(a.alignedToSheet,true);
 assert.equal(a.verified,false);
});
test('respeta la forma de la chapa que cambia con los golpes',()=>{
 const a=gaugePlacement({sheetDisplay:[{x:-40,y:1},{x:60,y:1}],
  die:{opening:16},piece:{thickness:2}},1);
 const b=gaugePlacement({sheetDisplay:[{x:-40,y:1},{x:45,y:28}],
  die:{opening:16},piece:{thickness:2}},1);
 assert.equal(a.alignedToSheet,true);
 assert.equal(b.alignedToSheet,false);
 assert.deepEqual(b.point,{x:45,y:28});
});
test('si sólo hay extremos a la izquierda no inventa un apoyo preciso',()=>{
 const r=gaugePlacement({sheetDisplay:[{x:-95,y:1},{x:0,y:1}],
  die:{opening:16},piece:{thickness:2}},1);
 assert.equal(r.alignedToSheet,false);
 assert.equal(r.sheetEdgeFound,false);
 assert.equal(r.verified,false);
 assert.equal(r.state,'sin borde trasero accesible');
});
test('el borde trasero coincide con la sección técnica del golpe actual',()=>{
 const p={...EXAMPLE,stopByBend:[1,2,1,2]};
 const s=technicalScene(p,stage(p,.6)),r=gaugePlacement(s,2);
 assert.equal(r.stopNumber,2);
 assert.equal(r.verified,false);
 assert.ok(Number.isFinite(r.point.x)&&Number.isFinite(r.point.y));
});
