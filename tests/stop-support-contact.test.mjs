import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_FACTORY,gaugeOutline,gaugeContactFeature,getV85} from '../machine-config.js';
import {EXAMPLE,normalized,stage,gaugeReference} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact,gaugeFoldedFlangeFace} from '../backgauge-placement.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' vs '+b);

test('croquis Cybelec: se conservan los dos perfiles completos y las cotas L1..L4',()=>{
 const stop=gaugeOutline(V85_FACTORY.stop),support=gaugeOutline(V85_FACTORY.support,2);
 assert.deepEqual(stop,[
  {x:0,y:-25},{x:100,y:-25},{x:100,y:0},
  {x:30,y:0},{x:30,y:-18},{x:0,y:-18}
 ]);
 assert.deepEqual(support,[
  {x:0,y:-25},{x:100,y:-25},{x:100,y:0},
  {x:30,y:0},{x:30,y:-8},{x:0,y:-8}
 ]);
});
test('Stop y Support difieren en cota pero ambos detienen por su frente X=0',()=>{
 const stop=gaugeContactFeature(V85_FACTORY.stop,1);
 const support=gaugeContactFeature(V85_FACTORY.support,2);
 assert.equal(stop.kind,'stop-face');
 assert.equal(support.kind,'support-step');
 assert.equal(stop.point.x,0);
 assert.equal(support.point.x,0);
 near(stop.point.y,-21.5);
 near(support.point.y,-16.5);
 assert.equal(stop.surface,'vertical-front');
 assert.equal(support.surface,'vertical-front');
 assert.equal(support.from.x,support.to.x);
 assert.equal(stop.usable,true);
 assert.equal(support.usable,true);
});
test('El cambio Stop → Support NO cambia la X nominal de pieza ni atraviesa la chapa',()=>{
 const p=normalized(EXAMPLE),before=structuredClone(p);
 const scene=technicalScene(p,.6),stop=gaugePlacement(scene,1),support=gaugePlacement(scene,2);
 assert.deepEqual(stop.point,support.point);
 assert.equal(stop.nominalDistance,50);
 assert.equal(support.nominalDistance,50);
 assert.equal(stop.referenceSide,'before');
 assert.equal(support.referenceSide,'before');
 assert.equal(stop.contact.kind,'stop-face');
 assert.equal(support.contact.kind,'support-step');
 assert.notDeepEqual(stop.contact.origin,support.contact.origin,'R distinto por altura física');
 const cfg=getV85();
 const stopWorld=gaugeContourAtContact(stop,cfg.stop);
 const supportWorld=gaugeContourAtContact(support,cfg.support);
 assert.deepEqual(stopWorld[0],stop.contact.from);
 assert.deepEqual(supportWorld[0],support.contact.from);
 assert.deepEqual(supportWorld[5],support.contact.to);
 assert.ok(supportWorld.every(pt=>pt.x>=support.point.x),
  'el dedo completo está DETRÁS del plano de contacto');
 assert.equal(stop.gaugeInterference.warning,false);
 assert.equal(support.gaugeInterference.warning,false);
 assert.deepEqual(p,before);
});
test('Golpe 3: al elegir ala opuesta, la medida 50 y las caras no cambian',()=>{
 const p=normalized(EXAMPLE),scene=technicalScene(p,10.4);
 const s1=gaugePlacement(scene,1),s2=gaugePlacement(scene,2);
 assert.equal(scene.stage.activeBend,3);
 assert.equal(s1.nominalDistance,50);assert.equal(s2.nominalDistance,50);
 assert.equal(s1.referenceSide,'after');assert.equal(s2.referenceSide,'after');
 assert.equal(s1.contact.surface,'vertical-front');
 assert.equal(s2.contact.surface,'vertical-front');
 assert.deepEqual(s1.point,s2.point);
});
test('Golpes 2 y 4: TOPE delante de cara exterior de ala plegada, no en fibra media',()=>{
 const p=normalized(EXAMPLE);
 for(const [time,bend] of [[5.2,1],[15.2,2]]){
  const scene=technicalScene(p,time);
  for(const n of [1,2]){
   const place=gaugePlacement(scene,n);
   assert.equal(scene.stage.activeBend,bend);
   assert.equal(place.freeEdge,false);
   assert.equal(place.frontFlange?.kind,'folded-flange-front');
   near(place.point.x,51);
   near(place.point.x,place.frontFlange.fiberX+p.thickness/2);
   assert.equal(place.contact.from.x,place.point.x);
   assert.equal(place.contact.to.x,place.point.x);
   assert.equal(place.contactEngaged,true);
   assert.equal(place.alignedToSheet,true);
   assert.equal(place.gaugeInterference.warning,false);
   assert.equal(place.verified,false);
  }
 }
});
test('un vértice interior SIN ala vertical accesible no obtiene apoyo ficticio',()=>{
 const sheet=[{x:30,y:1},{x:50,y:1},{x:40,y:1},{x:0,y:1}];
 assert.equal(gaugeFoldedFlangeFace(sheet,1,2),null);
});
test('L5/L6 sin mapa CAD no alteran las caras calculadas desde L1..L4',()=>{
 const a=gaugeOutline([70,100,8,25,12,8],2);
 const b=gaugeOutline([70,100,8,25,16,14],2);
 assert.deepEqual(a,b);
 assert.equal(gaugeContactFeature([70,100,8,25,12,8],2).point.x,
  gaugeContactFeature([70,100,8,25,16,14],2).point.x);
});
test('Automático P4 toma borde libre posterior; elección manual permanece',()=>{
 const p=normalized({...EXAMPLE,gaugeSideByBend:['auto','auto','auto','auto']});
 assert.equal(gaugeReference(p,0).side,'before');
 assert.equal(gaugeReference(p,3).side,'after');
 assert.equal(gaugeReference(p,3).distance,50);
 const place=gaugePlacement(technicalScene(p,stage(p,10.2)),1);
 assert.equal(place.sourceIndex,p.flanges.length);
 assert.equal(place.freeEdge,true);
 assert.equal(place.referenceSide,'after');
 const manual=normalized({...p,gaugeSideByBend:['auto','auto','auto','before']});
 assert.equal(gaugeReference(manual,3).side,'before');
});
test('el tope NO persigue el ala al bajar el punzón',()=>{
 const p=normalized(EXAMPLE);
 const early=gaugePlacement(technicalScene(p,.6),1);
 const late=gaugePlacement(technicalScene(p,2.9),1);
 assert.equal(early.contactEngaged,true);
 assert.equal(late.contactEngaged,false);
 assert.deepEqual(early.point,late.point);
 assert.match(late.state,/sin contacto actual/);
});
test('la pestaña del dedo permanece a izquierda del cuerpo completo tras cambiar L1..L4',()=>{
 for(const values of [[70,100,8,25,12,8],[50,125,10,31,12,8],[90,100,16,28,12,8]]){
  const face=gaugeContactFeature(values,2),outline=gaugeOutline(values,2);
  assert.equal(face.point.x,outline[0].x);
  assert.equal(face.from.x,outline[0].x);
  assert.equal(face.from.y,outline[0].y);
  assert.ok(outline[4].x>face.point.x);
  assert.ok(face.to.y>face.from.y);
 }
});
