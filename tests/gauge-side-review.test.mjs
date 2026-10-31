import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {compareGaugeSides} from '../gauge-side-review.js';

test('compara los dos apoyos del G3 sin modificar el programa ni los ángulos',()=>{
 const p=normalized({...EXAMPLE,punch:'goose'});
 const initial=structuredClone(p);
 const result=compareGaugeSides(p,10.5,3);
 assert.equal(result.operation,2);
 assert.equal(result.bend,3);
 assert.equal(result.currentSide,'after');
 assert.equal(result.samplesPerSide,3);
 assert.deepEqual(result.sides.map(x=>x.side),['before','after']);
 assert.ok(result.sides.every(x=>x.nominalDistance===50));
 assert.ok(result.sides.every(x=>Number.isFinite(x.score)&&x.verified===false));
 assert.equal(result.verified,false);
 assert.deepEqual(p,initial);
});
test('una referencia 20/180 conserva las distancias aunque se comparen útiles',()=>{
 const p={flanges:[20,180],angles:[90],order:[0],thickness:2,
  punch:'goose',die:'v16',gaugeSideByBend:['before']};
 const r=compareGaugeSides(p,.6,2);
 assert.deepEqual(r.sides.map(x=>x.nominalDistance),[20,180]);
 assert.ok([null,'before','after'].includes(r.better));
});
