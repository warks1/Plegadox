import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_FACTORY,gaugeOutline,gaugeContactFeature} from '../machine-config.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact,gaugeSeatAssessment} from '../backgauge-placement.js';
import {EXAMPLE} from '../engine.js';

/** IMG_9033.mp4: el perfil completo conserva los escalones mirando
 * a la izquierda; elegir Stop/Support NO invierte el dedo completo.
 * R37: el contacto de parada se realiza DELANTE, no encima de la repisa.
 */
test('el dedo COMPLETO conserva labio bajo izquierdo y contrahuella que sube',()=>{
 for(const values of [V85_FACTORY.stop,V85_FACTORY.support]){
  const stop=gaugeOutline(values,1),support=gaugeOutline(values,2);
  assert.deepEqual(stop,support,'No invertir el dedo al cambiar de función');
  const [a,b,c,d,e,f]=stop;
  const extent=Math.max(values[0],values[1]);
  const nose=extent-Math.min(extent,values[0]);
  assert.deepEqual([a,b,c,d,e,f],[
   {x:0,y:-values[3]},{x:extent,y:-values[3]},
   {x:extent,y:0},{x:nose,y:0},
   {x:nose,y:-values[2]},{x:0,y:-values[2]}
  ]);
  assert.equal(f.y,e.y);
  assert.equal(e.x,d.x);
  assert.ok(d.y>e.y,'contrahuella ascendente');
  const face=gaugeContactFeature(values,2);
  assert.deepEqual(face.from,a,'parada sobre cara frontal exterior');
  assert.deepEqual(face.to,f,'cara frontal de la pestaña inferior');
  assert.equal(face.surface,'vertical-front');
 }
});
test('la sección coloca la pieza DELANTE del dedo Support y Stop, sin atravesarlos',()=>{
 const scene=technicalScene(EXAMPLE,.6);
 for(const [kind,values] of [[1,V85_FACTORY.stop],[2,V85_FACTORY.support]]){
  const placed=gaugePlacement(scene,kind);
  const world=gaugeContourAtContact(placed,values);
  assert.equal(placed.sheetInFront,true);
  assert.equal(placed.seat.required,false);
  assert.equal(placed.seat.seated,true);
  assert.equal(placed.contactEngaged,true);
  assert.equal(placed.contact.surface,'vertical-front');
  assert.deepEqual(world[0],placed.contact.from);
  assert.deepEqual(world[5],placed.contact.to);
  assert.equal(placed.contact.point.x,placed.point.x);
  assert.ok(world.every(pt=>pt.x>=placed.point.x),
   'ninguna parte del cuerpo del tope pasa delante de la chapa');
  assert.equal(placed.gaugeInterference?.warning,false);
 }
});
test('se rechaza la cara frontal horizontal, ausente o desplazada del datum',()=>{
 const good=gaugeContactFeature(V85_FACTORY.support,2);
 const reference={sheet:[{x:0,y:1},{x:50,y:1}]};
 const point={x:50,y:1};
 assert.equal(gaugeSeatAssessment(reference,1,point,2,good).seated,true);
 const wrong={...good,from:{...good.from,x:good.from.x+2},
  to:{...good.to,x:good.to.x+2}};
 assert.equal(gaugeSeatAssessment(reference,1,point,2,wrong).seated,false);
 assert.equal(gaugeSeatAssessment(reference,1,point,2,{...good,from:null}).seated,false);
});
