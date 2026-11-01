import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectGaugeProfile} from '../gauge-interference.js';
import {EXAMPLE} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact} from '../backgauge-placement.js';
import {getV85} from '../machine-config.js';

const rect=[{x:10,y:-5},{x:40,y:-5},{x:40,y:5},{x:10,y:5}];
const contact={x:10,y:0};
test('contacto normal en el extremo de ala, sin falsa penetración',()=>{
 const m=inspectGaugeProfile([{x:0,y:0},{x:10,y:0}],rect,2,contact);
 assert.equal(m.warning,false);
});
test('detecta invasión real del perfil aunque el extremo nominal toque la cara correcta',()=>{
 const m=inspectGaugeProfile([{x:0,y:0},{x:25,y:0}],rect,2,contact);
 assert.equal(m.warning,true);
 assert.equal(m.kind,'penetracion');
 assert.ok(m.point.x>11);
});
test('advierte holgura insuficiente por espesor aunque el eje central no cruza',()=>{
 const m=inspectGaugeProfile([{x:0,y:6},{x:25,y:6}],rect,4,contact);
 assert.equal(m.warning,true);
 assert.equal(m.kind,'holgura');
});
test('un contacto válido vuelve a ser evaluable con Stop y Support sin cambiar su referencia X',()=>{
 const scene=technicalScene(EXAMPLE,.6);
 const a=gaugePlacement(scene,1),b=gaugePlacement(scene,2);
 assert.equal(a.stopNumber,1);assert.equal(b.stopNumber,2);
 assert.deepEqual(a.point,b.point);
 assert.equal(a.nominalDistance,50);assert.equal(b.nominalDistance,50);
 assert.ok(typeof a.gaugeInterference.warning==='boolean');
 for(const gauge of [a,b]){
  const profile=gaugeContourAtContact(gauge,gauge.stopNumber===2?getV85().support:getV85().stop);
  assert.ok(profile.length>=4);
  if(gauge.gaugeInterference.warning){
   assert.equal(gauge.alignedToSheet,false);
   assert.equal(gauge.contactEngaged,false);
  }
 }
});
test('durante la reproducción se conserva la referencia nominal, nunca se oculta una interferencia moviendo el tope',()=>{
 const anchor=gaugePlacement(technicalScene(EXAMPLE,.5),2).point;
 const points=[];
 for(const time of [1.2,2.6,3.1,4.5]){
  const p=gaugePlacement(technicalScene(EXAMPLE,time),2);
  points.push(p.point);
  assert.ok(typeof p.gaugeInterference.warning==='boolean');
  if(p.gaugeInterference.warning){
   assert.equal(p.contactEngaged,false);
   assert.equal(p.alignedToSheet,false);
   assert.match(p.state,/Posible/);
  }
 }
 assert.deepEqual(points,[anchor,anchor,anchor,anchor]);
});
