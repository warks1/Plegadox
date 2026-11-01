import test from 'node:test';
import assert from 'node:assert/strict';
import {gaugeOutline,gaugeContactFeature,V85_FACTORY} from '../machine-config.js';
import {gaugePlacement,gaugeContourAtContact} from '../backgauge-placement.js';
import {technicalScene} from '../technical-section.js';
import {EXAMPLE} from '../engine.js';
test('dedo completo: escalón hacia izquierda y parte trasera a derecha en ambos modos',()=>{
 for(const dimensions of [V85_FACTORY.stop,V85_FACTORY.support,[50,125,10,31,12,8]]){
  const a=gaugeOutline(dimensions,1),b=gaugeOutline(dimensions,2);
  assert.deepEqual(a,b,'Stop/Support no hacen un espejo adicional');
  const width=Math.max(1,dimensions[0],dimensions[1]);
  const lip=width-Math.min(width,dimensions[0]);
  assert.equal(a[0].x,0);
  assert.equal(a[5].x,0,'cara inferior/frontal en el borde izquierdo');
  assert.equal(a[4].x,lip);
  assert.equal(a[3].x,lip,'resalte más alto por detrás del escalón');
  assert.equal(a[5].y,a[4].y,'primer escalón horizontal');
  assert.equal(a[1].x,width,'cuerpo de tope por detrás de chapa');
 }
});
test('Stop 1: apoyo vertical en la parte frontal inferior, sin mover el borde de chapa',()=>{
 const scene=technicalScene(EXAMPLE,.6),place=gaugePlacement(scene,1);
 const pts=gaugeContourAtContact(place,V85_FACTORY.stop);
 assert.equal(place.contact.surface,'vertical-front');
 assert.deepEqual(place.contact.from,pts[5]);
 assert.deepEqual(place.contact.to,pts[0]);
 assert.equal(place.contact.from.x,place.point.x);
 assert.equal(place.contact.to.x,place.point.x);
 assert.ok(place.contact.from.y>place.contact.to.y);
});
test('Support 2: chapa apoyada ENCIMA del primer escalón horizontal a e/2',()=>{
 const scene=technicalScene(EXAMPLE,.6),stop=gaugePlacement(scene,1),
  support=gaugePlacement(scene,2);
 const pts=gaugeContourAtContact(support,V85_FACTORY.support);
 assert.deepEqual(stop.point,support.point,'no cambiar X programada');
 assert.equal(support.contact.surface,'horizontal-top');
 assert.deepEqual(support.contact.from,pts[5]);
 assert.deepEqual(support.contact.to,pts[4]);
 assert.ok(support.contact.from.x<support.point.x,'labio del escalón debajo del tramo de chapa');
 assert.equal(support.contact.to.x,support.point.x);
 assert.equal(support.contact.from.y,support.contact.to.y,'apoyo horizontal');
 assert.equal(support.contact.to.y,support.point.y-scene.piece.thickness/2);
});
test('la secuencia omega 1-2-4-3 conserva los dos apoyos sin invertir el tope',()=>{
 const original=structuredClone(EXAMPLE);
 for(const time of [.6,5.2,10.3,15.2]){
  const scene=technicalScene(original,time);
  const stop=gaugePlacement(scene,1),support=gaugePlacement(scene,2);
  assert.equal(stop.contact.surface,'vertical-front');
  assert.equal(support.contact.surface,'horizontal-top');
  assert.deepEqual(stop.point,support.point);
  assert.equal(support.contact.from.y,support.contact.to.y);
 }
 assert.deepEqual(original.angles,[90,-90,-90,90]);
});
