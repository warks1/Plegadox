import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_FACTORY,gaugeContactFeature,gaugeOutline} from '../machine-config.js';
import {gaugeStopOverlap} from '../backgauge-placement.js';

test('Stop detiene el canto frontal y Support lo apoya en repisa BAJA contra contrahuella',()=>{
 const stop=gaugeContactFeature(V85_FACTORY.stop,1);
 const support=gaugeContactFeature(V85_FACTORY.support,2);
 assert.equal(stop.surface,'vertical-front');
 assert.equal(support.surface,'horizontal-top');
 assert.ok(stop.usable&&support.usable);
 assert.equal(stop.from.x,stop.to.x);
 assert.equal(stop.point.x,0);
 assert.equal(support.from.y,support.to.y);
 assert.ok(support.frontFace.from.y<support.frontFace.to.y);
 assert.equal(support.frontFace.from.x,support.frontFace.to.x);
 assert.equal(support.to.x,support.frontFace.from.x);
 assert.ok(support.from.x<support.to.x);
 assert.ok(gaugeStopOverlap(stop,2).valid);
 assert.ok(gaugeStopOverlap(support,2).valid);
 assert.ok(support.point.x>0,'el canto se detiene delante de la pared de la repisa baja');
});

test('cambiar Stop y Support no invierte el contorno completo',()=>{
 const a=gaugeOutline(V85_FACTORY.stop,1);
 const b=gaugeOutline(V85_FACTORY.support,2);
 assert.equal(Math.sign(a[1].x-a[0].x),1);
 assert.equal(Math.sign(b[1].x-b[0].x),1);
 assert.equal(a.length,b.length);
});
