import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_FACTORY,gaugeOutline,gaugeContactFeature} from '../machine-config.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact,gaugeSeatAssessment} from '../backgauge-placement.js';
import {EXAMPLE} from '../engine.js';

/**
 * IMG_9033.mp4, 01/11/2026: contrahuella del dedo real ARRIBA
 * (apoyo inferior y canto detenido), no bajando después de la repisa.
 */
test('el dedo COMPLETO presenta saliente BAJO a la izquierda y pared que SUBE a la derecha',()=>{
 for(const values of [V85_FACTORY.stop,V85_FACTORY.support]){
  const stop=gaugeOutline(values,1),support=gaugeOutline(values,2);
  assert.deepEqual(stop,support,'No invertir el dedo al cambiar de función');
  const [a,b,c,d,e,f]=stop;
  const extent=Math.max(values[0],values[1]);
  const nose=extent-Math.min(extent,values[0]);
  assert.deepEqual([a,b,c,d,e,f],[
   {x:0,y:-values[3]}, {x:extent,y:-values[3]},
   {x:extent,y:0}, {x:nose,y:0},
   {x:nose,y:-values[2]}, {x:0,y:-values[2]}
  ]);
  assert.equal(f.y,e.y,'la pestaña delantera BAJA es horizontal');
  assert.equal(e.x,d.x,'la pared trasera es vertical');
  assert.ok(d.y>e.y,'la pared SUBE, no baja');
  const face=gaugeContactFeature(values,2);
  assert.deepEqual(face.from,f,'apoyo sobre la punta anterior');
  assert.deepEqual(face.to,e,'el canto llega al fondo de la repisa');
  assert.deepEqual(face.frontFace.from,e,'la pared comienza en el fondo del apoyo');
  assert.deepEqual(face.frontFace.to,d,'la pared termina arriba');
 }
});
test('la sección coloca chapa encima del saliente y la detiene contra la pared, SIN atravesar el tope',()=>{
 const scene=technicalScene(EXAMPLE,.6),sup=gaugePlacement(scene,2);
 const stop=gaugePlacement(scene,1);
 assert.equal(sup.sheetInFront,true,'la chapa entra desde el frente (izquierda)');
 assert.equal(sup.seat.required,true);
 assert.equal(sup.seat.seated,true);
 assert.equal(sup.contactEngaged,true);
 assert.equal(stop.contact.surface,'vertical-front');
 assert.equal(stop.contactEngaged,true);
 const wall=sup.contact.frontFace;
 const shelf=sup.contact;
 const thickness=scene.piece.thickness;
 assert.ok(shelf.from.x<shelf.to.x,'el labio bajo sobresale debajo de la chapa');
 assert.ok(Math.abs(shelf.point.y-(sup.point.y-thickness/2))<1e-8,
  'cara inferior de la chapa tocando el nivel de la repisa');
 assert.equal(shelf.to.x,sup.point.x,'el canto acaba en la pared');
 assert.equal(wall.from.x,sup.point.x);
 assert.equal(wall.to.x,sup.point.x);
 assert.equal(wall.from.y,shelf.to.y);
 assert.ok(wall.to.y>sup.point.y,
  'la pared sobresale por ENCIMA del canto, como en la máquina real');
 const world=gaugeContourAtContact(sup,V85_FACTORY.support);
 assert.deepEqual(world[5],shelf.from);
 assert.deepEqual(world[4],shelf.to);
 assert.deepEqual(world[3],wall.to);
 assert.equal(sup.gaugeInterference?.warning,false,
  'el contacto permitido no debe contarse como penetración');
});
test('el motor rechaza una repisa sin pared ASCENDENTE aunque parezca horizontal',()=>{
 const good=gaugeContactFeature(V85_FACTORY.support,2);
 const reference={sheet:[{x:0,y:1},{x:50,y:1}]},point={x:50,y:1};
 const a=gaugeSeatAssessment(reference,1,reference.point,2,good);
 assert.equal(a.seated,true);
 const down={...good,frontFace:{
  from:{...good.to},to:{x:good.to.x,y:good.to.y-6}
 }};
 const b=gaugeSeatAssessment(reference,1,reference.point,2,down);
 assert.equal(b.seated,false);
 assert.match(b.reason,/pared vertical ascendente/);
 const missing={...good,frontFace:null};
 assert.equal(gaugeSeatAssessment(reference,1,reference.point,2,missing).seated,false);
});
