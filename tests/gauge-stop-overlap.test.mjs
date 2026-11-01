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
test('no aceptar SUPPORT: la pared no llega a un cuarto del espesor en sección',()=>{
 const small=gaugeContactFeature([70,100,.3,25,12,8],2);
 const info=gaugeStopOverlap(small,2);
 assert.equal(info.valid,false);
 assert.ok(info.overlap<info.minimum);
 const ref={sheet:[{x:0,y:1},{x:50,y:1}]},point={x:50,y:1};
 const seat=gaugeSeatAssessment(ref,1,ref.point,2,small);
 assert.equal(seat.seated,false);
 assert.equal(seat.required,true);
 assert.match(seat.reason,/contrahuella sin solape/);
});
test('el espesor debe contar: misma pared puede no alcanzar un canto mucho más grueso',()=>{
 const sup=gaugeContactFeature(V85_FACTORY.support,2);
 assert.equal(gaugeStopOverlap(sup,2).valid,true);
 const heavy=gaugeStopOverlap(sup,40);
 assert.equal(heavy.overlap,8);
 assert.equal(heavy.minimum,10);
 assert.equal(heavy.valid,false);
});
test('pared vertical ausente o desviada no puede habilitar el apoyo',()=>{
 const sup=gaugeContactFeature(V85_FACTORY.support,2);
 assert.equal(gaugeStopOverlap({...sup,frontFace:null},2).valid,false);
 const moved={...sup,frontFace:{from:{x:40,y:-8},to:{x:40,y:0}}};
 assert.equal(gaugeStopOverlap(moved,2).valid,true,
  'Sólo el solape vertical no valida el contacto horizontal del canto');
 const flat={sheet:[{x:0,y:1},{x:50,y:1}]},p={x:50,y:1};
 assert.equal(gaugeSeatAssessment(flat,1,p,2,moved).seated,false,
  'La pared debe empezar exactamente al terminar la repisa');
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
