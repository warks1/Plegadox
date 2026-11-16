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
  if(gauge.gaugeInterference.kind==='penetracion'){
   assert.equal(gauge.alignedToSheet,false);
   assert.equal(gauge.contactEngaged,false);
  }
  // La holgura puede coexistir con un contacto nominal evaluable;
  // no debe transformarse automáticamente en falta de contacto.
 }
});
test('tope conserva la cota X/R nominal; sólo se aparta tras detectar colisión',()=>{
 const initial=technicalScene(EXAMPLE,.5),anchor=initial.gaugeAnchor;
 let retreatObserved=false;
 for(const time of [1.2,2.6,3.1,4.19]){
  const scene=technicalScene(EXAMPLE,time),place=gaugePlacement(scene,2);
  assert.deepEqual(scene.gaugeAnchor,anchor,
   'El anclaje X/R de programación no sigue el ala doblada');
  assert.ok(typeof place.gaugeInterference.warning==='boolean');
  if(scene.gaugePlan.enabled&&scene.gaugeTransition?.plannedRetraction>0){
   retreatObserved=true;
   assert.ok(place.point.x>=anchor.x-1e-6,'La retirada se hace hacia detrás');
   assert.deepEqual(scene.gaugeTransition.from,anchor,
    'La retirada nunca reubica su origen con la chapa');
  }
  if(place.gaugeInterference.kind==='penetracion'){
   assert.equal(place.contactEngaged,false);
   assert.equal(place.alignedToSheet,false);
  }
 }
 if(initial.gaugePlan.enabled)assert.ok(retreatObserved);
});

// Un primer ala que roce el cuerpo NO puede ocultar que una segunda ala
// atraviesa físicamente el volumen 2D del dedo en el MISMO fotograma.
test('penetración posterior prevalece sobre holgura detectada primero',()=>{
 const sheet=[{x:0,y:6},{x:25,y:6},{x:25,y:0}];
 const hit=inspectGaugeProfile(sheet,rect,4,contact);
 assert.equal(hit.warning,true);
 assert.equal(hit.kind,'penetracion');
 assert.equal(hit.segment,1,'el segundo tramo cruza el cuerpo del tope');
 assert.ok(hit.point.x>10&&hit.point.x<40);
});
