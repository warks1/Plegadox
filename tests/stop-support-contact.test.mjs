import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_FACTORY,gaugeOutline,gaugeContactFeature,getV85} from '../machine-config.js';
import {EXAMPLE,normalized,stage,gaugeReference} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact} from '../backgauge-placement.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' vs '+b);
test('Croquis de foto Cybelec: L2 ancho 100, L1 escalón en 70 y alturas L3/L4',()=>{
 const stop=gaugeOutline(V85_FACTORY.stop);
 const support=gaugeOutline(V85_FACTORY.support);
 assert.deepEqual(stop,[
  {x:0,y:0},{x:100,y:0},{x:100,y:-18},
  {x:70,y:-18},{x:70,y:-25},{x:0,y:-25}
 ]);
 assert.deepEqual(support,[
  {x:0,y:0},{x:100,y:0},{x:100,y:-8},
  {x:70,y:-8},{x:70,y:-25},{x:0,y:-25}
 ]);
});
test('Tope 1 y 2 NO comparten cara: frontal vs escalón',()=>{
 const stop=gaugeContactFeature(V85_FACTORY.stop,1);
 const support=gaugeContactFeature(V85_FACTORY.support,2);
 assert.equal(stop.kind,'stop-face');
 assert.equal(support.kind,'support-step');
 assert.equal(stop.point.x,0);
 assert.equal(support.point.x,70);
 near(stop.point.y,-12.5);
 near(support.point.y,-16.5);
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
 assert.deepEqual(stopWorld[0],{x:stop.point.x,y:stop.contact.origin.y});
 assert.notDeepEqual(stopWorld,supportWorld);
 const step=supportWorld[3];
 near(step.x,support.point.x);
 near(support.contact.from.x,support.point.x);
 near(support.contact.to.x,support.point.x);
 near(stop.contact.from.x,stop.point.x);
 near(stop.contact.to.x,stop.point.x);
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
test('Vértice interior: no inventar apoyo confirmado con ningún dedo',()=>{
 const p=normalized(EXAMPLE),scene=technicalScene(p,5.2);
 for(const n of [1,2]){
  const place=gaugePlacement(scene,n);
  assert.equal(place.freeEdge,false);
  assert.equal(place.alignedToSheet,false);
  assert.equal(place.verified,false);
  assert.equal(place.contact.verified,false);
 }
});
test('L5/L6 no modifican silenciosamente la cara CAD al faltar cota inequívoca',()=>{
 const a=gaugeOutline([70,100,8,25,12,8]);
 const b=gaugeOutline([70,100,8,25,16,14]);
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
