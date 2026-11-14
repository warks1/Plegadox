import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_FACTORY,gaugeOutline,gaugeContactFeature} from '../machine-config.js';
import {gaugePlacement,gaugeContourAtContact,sheetInFrontOfGauge} from '../backgauge-placement.js';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';

const close=(a,b,detail)=>assert.ok(Math.abs(a-b)<1e-6,detail+': '+a+' vs '+b);
test('los dos perfiles completos tienen escalones orientados a la izquierda, no un espejo parcial',()=>{
 for(const values of [V85_FACTORY.stop,V85_FACTORY.support]){
  assert.deepEqual(gaugeOutline(values,1),gaugeOutline(values,2));
  const pts=gaugeOutline(values,1);
  assert.equal(pts[0].x,0);
  assert.equal(pts[5].x,0);
  assert.equal(pts[4].x,values[1]-values[0]);
  assert.equal(pts[3].x,values[1]-values[0]);
  assert.equal(pts[2].x,values[1]);
 }
});
test('ambos topes detienen el CANTO por su cara frontal; nunca sobre escalón',()=>{
 const p=normalized(EXAMPLE),scene=technicalScene(p,.5),before=structuredClone(p);
 const a=gaugePlacement(scene,1),b=gaugePlacement(scene,2);
 for(const [n,place,values] of [[1,a,V85_FACTORY.stop],[2,b,V85_FACTORY.support]]){
  const world=gaugeContourAtContact(place,values);
  assert.equal(place.sheetInFront,true,'dedo '+n+' delante');
  assert.equal(place.contact.surface,'vertical-front');
  assert.equal(place.contactEngaged,true);
  close(place.contact.from.x,place.point.x,'frente '+n);
  close(place.contact.to.x,place.point.x,'frente '+n);
  assert.deepEqual(world[0],place.contact.from);
  assert.deepEqual(world[5],place.contact.to);
  assert.ok(world.every(pt=>pt.x>=place.point.x-1e-8),
   'Todo el dedo detrás de la chapa');
  assert.equal(place.gaugeInterference.warning,false);
 }
 assert.deepEqual(a.point,b.point,'Cambiar dedo no cambia X/R nominal de la pieza');
 assert.deepEqual(p,before,'Sin modificar pieza, signos ni orden');
});
test('chapa llegando por detrás del tope NO puede anunciar apoyo válido aunque coincida el punto',()=>{
 const front={
  sheet:[{x:50,y:1},{x:15,y:1}],sheetDisplay:[{x:50,y:1},{x:15,y:1}],
  gaugeReference:{sourceIndex:0,distance:50,side:'before',label:'ala libre'},
  gaugeAnchor:{x:50,y:1},stage:{phase:'Posicionamiento'},
  piece:{thickness:2},die:{opening:16}
 };
 const back={...front,sheet:[{x:50,y:1},{x:70,y:1}],
  sheetDisplay:[{x:50,y:1},{x:70,y:1}]};
 assert.equal(sheetInFrontOfGauge(front,0,front.gaugeAnchor,2),true);
 assert.equal(sheetInFrontOfGauge(back,0,front.gaugeAnchor,2),false);
 for(const n of [1,2]){
  const contact=gaugePlacement(back,n);
  assert.equal(contact.sheetInFront,false);
  assert.equal(contact.contactEngaged,false);
  assert.equal(contact.alignedToSheet,false);
  assert.match(contact.state,/DETRÁS/);
  assert.equal(contact.nominalDistance,50);
 }
});
