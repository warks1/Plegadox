import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_FACTORY,gaugeOutline,gaugeContactFeature} from '../machine-config.js';
import {gaugePlacement,gaugeContourAtContact,sheetInFrontOfGauge} from '../backgauge-placement.js';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';

const close=(a,b,detail)=>assert.ok(Math.abs(a-b)<1e-6,detail+': '+a+' vs '+b);
test('los dos perfiles completos tienen escalones orientados a la izquierda, no un espejo parcial',()=>{
 for(const values of [V85_FACTORY.stop,V85_FACTORY.support]){
  assert.deepEqual(gaugeOutline(values,1),gaugeOutline(values,2));
  const pts=gaugeOutline(values,1);
  assert.equal(pts[0].x,0);
  assert.equal(pts[5].x,0);
  assert.equal(pts[4].x,values[1]-values[0]);
  assert.equal(pts[3].x,values[1]-values[0]);
  assert.equal(pts[2].x,values[1]);
 }
});
test('cara inferior STOP en contacto frontal, repisa y frente vertical SUPPORT a la vez',()=>{
 const p=normalized(EXAMPLE),scene=technicalScene(p,.5),before=structuredClone(p);
 const a=gaugePlacement(scene,1),b=gaugePlacement(scene,2);
 const stop=gaugeContourAtContact(a,V85_FACTORY.stop);
 const support=gaugeContourAtContact(b,V85_FACTORY.support);
 assert.equal(a.sheetInFront,true,'STOP: chapa delante');
 assert.equal(b.sheetInFront,true,'SUPPORT: chapa delante');
 assert.equal(a.contact.surface,'vertical-front');
 assert.equal(b.contact.surface,'horizontal-top');
 assert.equal(a.contactEngaged,true);
 assert.equal(b.contactEngaged,true);
 assert.equal(a.contact.from.x,a.point.x);
 assert.equal(a.contact.to.x,a.point.x);
 // El canto termina exactamente en el extremo trasero del escalón.
 close(b.contact.to.x,b.point.x,'borde coincide con la contrahuella');
 close(b.contact.frontFace.from.x,b.point.x,'frente vertical bajo el canto');
 close(b.contact.frontFace.to.x,b.point.x,'frente vertical sobre el canto');
 // La CARA INFERIOR de chapa descansa SOBRE el escalón.
 close(b.contact.from.y,b.point.y-p.thickness/2,'cara superior de la repisa');
 close(b.contact.to.y,b.point.y-p.thickness/2,'repisas al mismo nivel');
 assert.ok(b.contact.from.x<b.point.x,'repisa entra bajo la chapa, hacia la izquierda');
 assert.ok(b.contact.frontFace.to.y>b.point.y,'contrahuella posterior sube para detener el canto');
 assert.deepEqual(stop[0],a.contact.from);
 assert.deepEqual(stop[5],a.contact.to);
 assert.deepEqual(support[5],b.contact.from);
 assert.deepEqual(support[4],b.contact.to);
 assert.deepEqual(support[3],b.contact.frontFace.to);
 assert.deepEqual(a.point,b.point,'Cambiar tipo de dedo no mueve la referencia de pieza');
 assert.deepEqual(p,before,'Sin modificar pieza, signos ni orden');
});
test('chapa llegando por detrás del tope NO puede anunciar apoyo válido aunque coincida el punto',()=>{
 const front={
  sheet:[{x:50,y:1},{x:15,y:1}],sheetDisplay:[{x:50,y:1},{x:15,y:1}],
  gaugeReference:{sourceIndex:0,distance:50,side:'before',label:'ala libre'},
  gaugeAnchor:{x:50,y:1},stage:{phase:'Posicionamiento'},
  piece:{thickness:2},die:{opening:16}
 };
 const back={...front,sheet:[{x:50,y:1},{x:70,y:1}],
  sheetDisplay:[{x:50,y:1},{x:70,y:1}]};
 assert.equal(sheetInFrontOfGauge(front,0,front.gaugeAnchor,2),true);
 assert.equal(sheetInFrontOfGauge(back,0,front.gaugeAnchor,2),false);
 for(const n of [1,2]){
  const contact=gaugePlacement(back,n);
  assert.equal(contact.sheetInFront,false);
  assert.equal(contact.contactEngaged,false);
  assert.equal(contact.alignedToSheet,false);
  assert.match(contact.state,/DETRÁS/);
  assert.equal(contact.nominalDistance,50);
 }
});
