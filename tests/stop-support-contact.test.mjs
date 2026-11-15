import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_FACTORY,gaugeOutline,gaugeContactFeature,getV85} from '../machine-config.js';
import {EXAMPLE,normalized,stage,gaugeReference} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact} from '../backgauge-placement.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' vs '+b);
test('Croquis de foto Cybelec: L2 ancho 100, L1 escalón en 70 y alturas L3/L4',()=>{
 const stop=gaugeOutline(V85_FACTORY.stop);
 const support=gaugeOutline(V85_FACTORY.support,2);
 assert.deepEqual(stop,[
  {x:0,y:-25},{x:100,y:-25},{x:100,y:0},
  {x:30,y:0},{x:30,y:-18},{x:0,y:-18}
 ]);
 assert.deepEqual(support,[
  {x:0,y:-25},{x:100,y:-25},{x:100,y:0},
  {x:30,y:0},{x:30,y:-8},{x:0,y:-8}
 ]);
});
test('Tope 1 y 2 NO comparten cara: frontal vs escalón',()=>{
 const stop=gaugeContactFeature(V85_FACTORY.stop,1);
 const support=gaugeContactFeature(V85_FACTORY.support,2);
 assert.equal(stop.kind,'stop-face');
 assert.equal(support.kind,'support-step');
 assert.equal(stop.point.x,0);
 assert.equal(support.point.x,30);
 near(stop.point.y,-21.5);
 near(support.point.y,-8);
 assert.equal(stop.surface,'vertical-front');
 assert.equal(support.surface,'horizontal-top');
 assert.equal(support.from.y,support.to.y);
 assert.equal(stop.usable,true);
 assert.equal(support.usable,true);
});
test('El cambio Stop → Support mueve el dedo: chapa y referencia de 50 mm no saltan',()=>{
 const p=normalized(EXAMPLE),before=structuredClone(p);
 const scene=technicalScene(p,stage(p,.6));
 const stop=gaugePlacement(scene,1),support=gaugePlacement(scene,2);
 assert.deepEqual(stop.point,support.point);
 assert.equal(stop.nominalDistance,50);
 assert.equal(support.nominalDistance,50);
 assert.equal(stop.referenceSide,'before');
 assert.equal(support.referenceSide,'before');
 assert.equal(stop.contact.kind,'stop-face');
 assert.equal(support.contact.kind,'support-step');
 assert.notDeepEqual(stop.contact.origin,support.contact.origin);
 const cfg=getV85();
 const stopWorld=gaugeContourAtContact(stop,cfg.stop);
 const supportWorld=gaugeContourAtContact(support,cfg.support);
 assert.deepEqual(stopWorld[0],{x:stop.point.x,y:stop.contact.origin.y-25});
 assert.notDeepEqual(stopWorld,supportWorld);
 const step=supportWorld[4];
 near(step.x,support.point.x);
 near(support.contact.from.x,support.point.x-30);
 near(support.contact.to.x,support.point.x);
 near(stop.contact.from.x,stop.point.x);
 near(stop.contact.to.x,stop.point.x);
 near(support.contact.to.y,support.point.y-1);
 assert.deepEqual(p,before);
});
test('Golpe 3: elección de ala opuesta conserva 50 mm y Stop/Support respetan su cara',()=>{
 const p=normalized(EXAMPLE),scene=technicalScene(p,10.4);
 const s1=gaugePlacement(scene,1),s2=gaugePlacement(scene,2);
 assert.equal(scene.stage.activeBend,3);
 assert.equal(s1.nominalDistance,50);
 assert.equal(s2.nominalDistance,50);
 assert.equal(s1.referenceSide,'after');
 assert.equal(s2.referenceSide,'after');
 assert.equal(s1.contact.kind,'stop-face');
 assert.equal(s2.contact.kind,'support-step');
 assert.deepEqual(s1.point,s2.point);
});
test('el modo automático descarta vértices interiores y el manual los señaliza como inválidos',()=>{
 const auto=technicalScene(normalized(EXAMPLE),5.2);
 assert.ok(auto.gaugeSetup.candidates.length>=1);
 if(auto.gaugeSetup.valid){
  assert.equal(auto.gaugeReference.freeEdge,true);
  assert.equal(auto.gaugeSetup.ref.freeEdge,true);
 }
 // Si el operador fuerza el ala interior, conservar esa decisión en
 // pantalla pero NO declarar contacto seguro ni moverlo a otra ala.
 const manual=normalized({...EXAMPLE,
  gaugeSideByBend:['auto','before','auto','auto'],
  gaugeSegmentByBend:[null,1,null,null]});
 const scene=technicalScene(manual,5.2);
 assert.equal(scene.gaugeSetup.manual,true);
 assert.equal(scene.gaugeSetup.valid,false);
 for(const n of [1,2]){
  const place=gaugePlacement(scene,n);
  assert.equal(place.freeEdge,false);
  assert.equal(place.alignedToSheet,false);
  assert.equal(place.verified,false);
  assert.equal(place.contact.verified,false);
 }
});

test('L5/L6 no modifican silenciosamente la cara CAD al faltar cota inequívoca',()=>{
 const a=gaugeOutline([70,100,8,25,12,8],2);
 const b=gaugeOutline([70,100,8,25,16,14],2);
 assert.deepEqual(a,b);
 assert.equal(gaugeContactFeature([70,100,8,25,12,8],2).point.x,
  gaugeContactFeature([70,100,8,25,16,14],2).point.x);
});

test('Automático P4 de omega toma borde libre posterior, nunca vértice interior anterior',()=>{
 const p=normalized({...EXAMPLE,gaugeSideByBend:['auto','auto','auto','auto']});
 assert.equal(gaugeReference(p,0).side,'before','G1 por ala libre de 50');
 assert.equal(gaugeReference(p,3).side,'after','G3→P4 por ala libre de 50');
 assert.equal(gaugeReference(p,3).distance,50);
 const st=stage(p,10.2),view=technicalScene(p,st);
 const place=gaugePlacement(view,1);
 assert.equal(place.sourceIndex,p.flanges.length);
 assert.equal(place.freeEdge,true);
 assert.equal(place.referenceSide,'after');
 const manual=normalized({...p,gaugeSideByBend:['auto','auto','auto','before']});
 assert.equal(gaugeReference(manual,3).side,'before','No anular elección manual');
});

test('la referencia X/R no persigue la chapa: sólo se retira si hay choque previsto',()=>{
 const p=normalized(EXAMPLE);
 const earlyScene=technicalScene(p,.6),lateScene=technicalScene(p,2.9);
 const early=gaugePlacement(earlyScene,1),late=gaugePlacement(lateScene,1);
 assert.equal(early.alignedToSheet,true);
 assert.equal(early.contactEngaged,true);
 assert.equal(late.alignedToSheet,false);
 assert.equal(late.contactEngaged,false);
 assert.deepEqual(earlyScene.gaugeAnchor,lateScene.gaugeAnchor,
  'La cota nominal debe permanecer fija al deformarse la chapa');
 assert.equal(early.nominalDistance,late.nominalDistance);
 if(lateScene.gaugePlan.enabled){
  assert.ok(lateScene.gaugeTransition?.plannedRetraction>0,
   'Sólo el barrido que detectó interferencia puede separar el dedo');
  assert.ok(late.point.x>early.point.x,'Si retrocede va hacia X posterior');
 }else{
  assert.equal(lateScene.gaugeTransition,null,
   'Sin interferencia, el tope espera al reposicionamiento final');
  assert.deepEqual(late.point,early.point);
 }
 assert.match(late.state,/retirado|referencia nominal|interferencia|contacto actual|TOPE/i);
});

test('el mismo tope mira a la izquierda en ambas posiciones, sin inversión secundaria',()=>{
 const original=gaugeOutline(V85_FACTORY.support);
 const mirror=gaugeOutline(V85_FACTORY.support,2);
 assert.deepEqual(mirror,original);
 assert.equal(mirror[5].x,0);
 assert.equal(mirror[4].x,30);
 assert.equal(gaugeBoundsSupportHeight(),25);
 const scene=technicalScene(EXAMPLE,.5);
 const place=gaugePlacement(scene,2);
 const world=gaugeContourAtContact(place,V85_FACTORY.support);
 assert.deepEqual(world,mirror.map(pt=>({
  x:place.contact.origin.x+pt.x,y:place.contact.origin.y+pt.y
 })));
 // Superficie de apoyo horizontal 5→4, bajo la chapa de 2 mm.
 assert.deepEqual(world[5],place.contact.from);
 assert.deepEqual(world[4],place.contact.to);
 assert.equal(place.contact.point.x,place.point.x);
 near(place.contact.point.y,place.point.y-1);
 assert.equal(place.contact.mirrorX,false);
 function gaugeBoundsSupportHeight(){
  return Math.max(...mirror.map(p=>p.y))-Math.min(...mirror.map(p=>p.y));
 }
});
test('Support sigue orientado al mismo lado aunque se editen L1, L2, L3, L4',()=>{
 for(const values of [[70,100,8,25,12,8],[50,125,10,31,12,8],[90,100,16,28,12,8]]){
  const face=gaugeContactFeature(values,2);
  const support=gaugeOutline(values,2);
  assert.equal(face.point.x,support[4].x);
  assert.equal(face.from.x,support[5].x);
  assert.equal(face.from.y,face.to.y);
  assert.ok(face.point.x<Math.max(...support.map(p=>p.x)));
  assert.equal(support[4].y,-values[2]);
 }
});
