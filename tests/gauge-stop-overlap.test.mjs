import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_FACTORY,gaugeContactFeature} from '../machine-config.js';
import {gaugePlacement,gaugeStopOverlap,gaugeSeatAssessment} from '../backgauge-placement.js';
import {technicalScene} from '../technical-section.js';
import {EXAMPLE,normalized} from '../engine.js';

test('Stop frontal y Support escalonado solapan con el espesor de chapa de referencia',()=>{
 for(const n of [1,2]){
  const feature=gaugeContactFeature(n===1?V85_FACTORY.stop:V85_FACTORY.support,n);
  const contact=gaugeStopOverlap(feature,2);
  assert.equal(contact.valid,true);
  assert.equal(contact.overlap,2,'el plano de contacto interseca el espesor completo');
  assert.equal(contact.minimum,.5,'umbral orientativo es un cuarto del espesor');
 }
});
test('no aceptar STOP: una cara frontal minúscula no detiene un canto de espesor real',()=>{
 const tiny=gaugeContactFeature([70,100,24.8,25,12,0],1);
 const info=gaugeStopOverlap(tiny,2);
 assert.equal(info.valid,false);
 assert.ok(info.overlap<info.minimum);
 const checked=gaugeSeatAssessment({sheet:[{x:0,y:1},{x:50,y:1}]},
  1,{x:50,y:1},2,tiny);
 assert.equal(checked.seated,false);
 assert.equal(checked.required,false,'STOP no necesita apoyo horizontal');
 assert.match(checked.reason,/sin solape suficiente/);
});
test('no aceptar SUPPORT: una cara frontal excesivamente corta no puede parar el canto',()=>{
 const tiny=gaugeContactFeature([70,100,24.8,25,12,8],2);
 const info=gaugeStopOverlap(tiny,2);
 assert.equal(info.valid,false);
 assert.ok(info.overlap<info.minimum);
 const ref={sheet:[{x:0,y:1},{x:50,y:1}]},point={x:50,y:1};
 const seat=gaugeSeatAssessment(ref,1,ref.point,2,tiny);
 assert.equal(seat.seated,false);
 assert.equal(seat.required,false,'la parada frontal NO exige repisa horizontal');
 assert.match(seat.reason,/sin solape suficiente/);
});
test('el espesor cuenta: la cara frontal debe solapar al menos 1/4 del canto',()=>{
 const sup=gaugeContactFeature(V85_FACTORY.support,2);
 assert.equal(gaugeStopOverlap(sup,2).valid,true);
 const heavy=gaugeStopOverlap(sup,80);
 assert.equal(heavy.overlap,17);
 assert.equal(heavy.minimum,20);
 assert.equal(heavy.valid,false);
});
test('cara frontal desplazada o sin vértices nunca se acredita como apoyo',()=>{
 const sup=gaugeContactFeature(V85_FACTORY.support,2);
 assert.equal(gaugeStopOverlap({...sup,from:null},2).valid,false);
 const shifted={...sup,from:{...sup.from,x:4},to:{...sup.to,x:4}};
 assert.equal(gaugeStopOverlap(shifted,2).valid,false);
 const flat={sheet:[{x:0,y:1},{x:50,y:1}]},p={x:50,y:1};
 assert.equal(gaugeSeatAssessment(flat,1,p,2,shifted).seated,false);
});
test('referencia omega 1-2-4-3 conserva contactos nominales durante posicionamiento, no durante retirada',()=>{
 const piece=normalized(EXAMPLE);
 for(const n of [1,2]){
  const initial=gaugePlacement(technicalScene(piece,.5),n);
  assert.equal(initial.seat.seated,true);
  assert.equal(initial.contactEngaged,true);
  assert.equal(initial.gaugeInterference.warning,false);
  const moving=gaugePlacement(technicalScene(piece,4.6),n);
  assert.equal(moving.contactEngaged,false);
  assert.equal(moving.moving,true);
 }
 assert.deepEqual(piece.order,[0,1,3,2]);
 assert.deepEqual(piece.angles,[90,-90,-90,90]);
});
