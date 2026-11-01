import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_FACTORY,gaugeOutline,gaugeContactFeature} from '../machine-config.js';
import {gaugeSeatAssessment,gaugePlacement,gaugeContourAtContact} from '../backgauge-placement.js';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';

const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' no coincide con '+b);
test('todo el cuerpo del tope se orienta a la derecha y AMBOS escalones miran a la izquierda',()=>{
 for(const cfg of [V85_FACTORY.stop,V85_FACTORY.support]){
  const a=gaugeOutline(cfg,1),b=gaugeOutline(cfg,2);
  assert.deepEqual(a,b,'No girar el perfil al elegir Stop o Support');
  assert.ok(a.every(p=>p.x>=0),'Ninguna porción detrás del frente izquierdo');
  assert.deepEqual(a[5],{x:0,y:-cfg[2]});
  assert.equal(a[4].x,cfg[1]-cfg[0]);
  assert.equal(a[3].x,a[4].x);
  assert.equal(a[2].x,cfg[1]);
 }
});
test('en la presentación la chapa apoya frontalmente en STOP o sobre la repisa y contra el escalón SUPPORT',()=>{
 const scene=technicalScene(normalized(EXAMPLE),.5);
 const stop=gaugePlacement(scene,1),sup=gaugePlacement(scene,2);
 assert.equal(stop.sheetInFront,true);
 assert.equal(sup.sheetInFront,true);
 assert.equal(stop.contactEngaged,true);
 assert.equal(sup.contactEngaged,true);
 assert.equal(stop.seat.required,false);
 assert.equal(sup.seat.required,true);
 assert.equal(sup.seat.seated,true);
 const A=gaugeContourAtContact(stop,V85_FACTORY.stop);
 const B=gaugeContourAtContact(sup,V85_FACTORY.support);
 approx(stop.contact.from.x,stop.point.x);
 approx(stop.contact.to.x,stop.point.x);
 approx(sup.contact.to.x,sup.point.x);
 approx(sup.contact.frontFace.from.x,sup.point.x);
 approx(sup.contact.from.y,sup.point.y-scene.piece.thickness/2);
 assert.ok(sup.contact.from.x<sup.point.x,'la repisa queda delante, a la izquierda');
 assert.deepEqual(B[5],sup.contact.from);
 assert.deepEqual(B[4],sup.contact.to);
 assert.deepEqual(B[3],sup.contact.frontFace.to);
 assert.deepEqual(A[5],stop.contact.from);
 assert.deepEqual(A[0],stop.contact.to);
});
test('si el ala llega inclinada, no anunciar apoyo válido sobre la repisa por tocar solamente un vértice',()=>{
 const feature=gaugeContactFeature(V85_FACTORY.support,2);
 const flat={sheet:[{x:15,y:1},{x:50,y:1}]};
 const slope={sheet:[{x:15,y:12},{x:50,y:1}]};
 const point={x:50,y:1};
 assert.equal(gaugeSeatAssessment(flat,1,point,2,feature).seated,true);
 const assessed=gaugeSeatAssessment(slope,1,point,2,feature);
 assert.equal(assessed.required,true);
 assert.equal(assessed.seated,false);
 assert.match(assessed.reason,/inclinada/);
 const common={sheetDisplay:slope.sheet,gaugeReference:{sourceIndex:1,distance:35,
  label:'ala siguiente',side:'after'},gaugeAnchor:point,
  stage:{phase:'Posicionamiento'},piece:{thickness:2},die:{opening:16}};
 const p=gaugePlacement({...slope,...common},2);
 assert.equal(p.sheetInFront,true);
 assert.equal(p.seat.seated,false);
 assert.equal(p.contactEngaged,false);
 assert.equal(p.alignedToSheet,false);
 assert.match(p.state,/NO asienta/);
 // Elegir cara inferior Stop no exige un asiento plano en la repisa.
 const stop=gaugePlacement({...slope,...common},1);
 assert.equal(stop.seat.required,false);
});
test('el contorno completo conserva su sentido y los dos contactos durante todos los golpes de omega',()=>{
 const piece=normalized(EXAMPLE),before=structuredClone(piece);
 for(const time of [.5,5.5,10.5,15.5]){
  const scene=technicalScene(piece,time);
  for(const n of [1,2]){
   const place=gaugePlacement(scene,n);
   const vertices=gaugeContourAtContact(place,n===1?V85_FACTORY.stop:V85_FACTORY.support);
   assert.ok(vertices.every(p=>p.x>=place.point.x-(n===2?30:0)-1e-6),
    'El cuerpo del tope no debe saltar delante de la chapa, t='+time+' dedo='+n);
   assert.ok(vertices.some(p=>p.x>place.point.x),
    'El cuerpo del tope debe quedar por detrás, t='+time+' dedo='+n);
   assert.equal(place.contact.surface,n===1?'vertical-front':'horizontal-top');
   if(n===2){
    approx(place.contact.to.x,place.point.x);
    approx(place.contact.to.y,place.point.y-piece.thickness/2);
    approx(place.contact.frontFace.from.x,place.point.x);
   }else approx(place.contact.to.x,place.point.x);
  }
 }
 assert.deepEqual(piece,before,'Nunca modificar la pieza o las referencias');
});
