import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_FACTORY,gaugeContactFeature,gaugeOutline} from '../machine-config.js';
import {gaugeStopOverlap} from '../backgauge-placement.js';

test('ambos dedos detienen el canto por la cara frontal y no encima de la repisa',()=>{
 for(const [number,values] of [[1,V85_FACTORY.stop],[2,V85_FACTORY.support]]){
  const f=gaugeContactFeature(values,number);
  assert.equal(f.surface,'vertical-front');
  assert.ok(f.usable);
  assert.equal(f.from.x,f.to.x);
  assert.equal(f.point.x,Math.min(...gaugeOutline(values,number).map(p=>p.x)));
  assert.ok(gaugeStopOverlap(f,2).valid);
  assert.ok(!f.label.includes('SOBRE PRIMER ESCALÓN'));
 }
});

test('cambiar Stop y Support no invierte el contorno completo',()=>{
 const a=gaugeOutline(V85_FACTORY.stop,1);
 const b=gaugeOutline(V85_FACTORY.support,2);
 assert.equal(Math.sign(a[1].x-a[0].x),1);
 assert.equal(Math.sign(b[1].x-b[0].x),1);
 assert.equal(a.length,b.length);
});
