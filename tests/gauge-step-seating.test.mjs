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
  assert.ok(a[3].y>a[4].y,'el escalón debe subir, no bajar');
 }
});
test('ambos dedos presentan su cara FRONTAL, incluso si el cuerpo tiene escalones',()=>{
 const scene=technicalScene(normalized(EXAMPLE),.5);
 const stop=gaugePlacement(scene,1),sup=gaugePlacement(scene,2);
 for(const [place,cfg] of [[stop,V85_FACTORY.stop],[sup,V85_FACTORY.support]]){
  assert.equal(place.sheetInFront,true);
  assert.equal(place.contactEngaged,true);
  assert.equal(place.contact.surface,'vertical-front');
  assert.equal(place.seat.required,false);
  assert.equal(place.seat.seated,true);
  const contour=gaugeContourAtContact(place,cfg);
  assert.deepEqual(contour[0],place.contact.from);
  assert.deepEqual(contour[5],place.contact.to);
  approx(place.contact.from.x,place.point.x);
  approx(place.contact.to.x,place.point.x);
  assert.ok(contour.every(pt=>pt.x>=place.point.x),
   'el volumen completo del tope empieza tras la cara de parada');
 }
});
test('un ala vertical no se detiene sobre su FIBRA, sino sobre su superficie exterior',()=>{
 const scene=technicalScene(normalized(EXAMPLE),5.5);
 const feature=gaugeContactFeature(V85_FACTORY.support,2);
 const right={x:scene.gaugeAnchor.x,y:scene.gaugeAnchor.y};
 const good=gaugeSeatAssessment({sheet:scene.gaugeSetupSheet},
  1,right,scene.piece.thickness,feature);
 assert.equal(good.seated,true);
 assert.equal(good.required,false);
 assert.equal(good.xError,0);
 const wrong=gaugeSeatAssessment({sheet:scene.gaugeSetupSheet},
  1,{x:right.x-scene.piece.thickness/2,y:right.y},
  scene.piece.thickness,feature);
 assert.equal(wrong.seated,false);
 assert.match(wrong.reason,/sin cara frontal accesible/);
});
test('en la omega el cuerpo queda a la derecha en los cuatro golpes; 2 y 4 sobre cara plegada',()=>{
 const piece=normalized(EXAMPLE),before=structuredClone(piece);
 for(const [operation,time] of [[1,.5],[2,5.5],[3,10.5],[4,15.5]]){
  const scene=technicalScene(piece,time);
  for(const n of [1,2]){
   const place=gaugePlacement(scene,n);
   const values=n===1?V85_FACTORY.stop:V85_FACTORY.support;
   const vertices=gaugeContourAtContact(place,values);
   assert.ok(vertices.every(pt=>pt.x>=place.point.x-1e-8),
    'El dedo no debe entrar por delante, G'+operation+' dedo '+n);
   assert.ok(vertices.some(pt=>pt.x>place.point.x));
   assert.equal(place.contact.surface,'vertical-front');
   assert.equal(place.contact.to.x,place.point.x);
   assert.equal(place.contact.from.x,place.point.x);
   assert.equal(place.gaugeInterference.warning,false,
    'No atravesar chapa, G'+operation+' dedo '+n);
   if(operation===2||operation===4){
    assert.equal(place.frontFlange?.faceX,place.point.x);
    assert.equal(place.freeEdge,false);
    assert.equal(place.contactEngaged,true);
   }
  }
 }
 assert.deepEqual(piece,before);
});
