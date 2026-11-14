import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact,gaugeFoldedFlangeFace} from '../backgauge-placement.js';
import {V85_FACTORY} from '../machine-config.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' ≠ '+b);
test('R37: omega 1-2-4-3 apoya DELANTE del tope en los cuatro golpes',()=>{
 const piece=normalized(EXAMPLE),copy=structuredClone(piece);
 for(const [i,time] of [[0,.5],[1,5.5],[2,10.5],[3,15.5]]){
  const scene=technicalScene(piece,time);
  const interior=i===1||i===3;
  for(const [n,values] of [[1,V85_FACTORY.stop],[2,V85_FACTORY.support]]){
   const p=gaugePlacement(scene,n);
   const contour=gaugeContourAtContact(p,values);
   assert.equal(p.contact.surface,'vertical-front');
   assert.equal(p.nominalDistance,50);
   assert.equal(p.contactEngaged,true,'golpe '+(i+1)+' dedo '+n);
   assert.equal(p.gaugeInterference.warning,false,'interferencia en golpe '+(i+1));
   assert.equal(p.seat.seated,true);
   near(p.point.x,interior?51:50);
   assert.equal(Boolean(p.frontFlange),interior);
   if(interior){
    assert.equal(p.freeEdge,false);
    near(p.point.x,p.frontFlange.fiberX+piece.thickness/2);
    assert.equal(p.referenceKind,'cara frontal del ala plegada');
   }else assert.equal(p.freeEdge,true);
   near(contour[0].x,p.point.x);
   assert.ok(contour.every(v=>v.x>=p.point.x-1e-8),
    'cuerpo completo no invade la parte anterior de la chapa');
  }
 }
 assert.deepEqual(piece,copy,'El programa no modifica la omega ni su orden');
});
test('R37: al terminar presentación no se sigue el ala ni se falsea contacto CNC',()=>{
 const piece=normalized(EXAMPLE);
 for(const t of [2.9,7.9,12.9,17.9]){
  const place=gaugePlacement(technicalScene(piece,t),1);
  assert.equal(place.contactEngaged,false);
  assert.equal(place.verified,false);
 }
});
test('R37: sin ala vertical auténtica no se permite un contacto interior',()=>{
 const sheet=[{x:25,y:1},{x:50,y:1},{x:20,y:1},{x:-30,y:1}];
 assert.equal(gaugeFoldedFlangeFace(sheet,1,2),null);
});
test('R37: la cara de referencia exterior cambia e/2 con el espesor, no BL',()=>{
 const scene=technicalScene({...EXAMPLE,thickness:6},5.5);
 const place=gaugePlacement(scene,2);
 near(place.frontFlange?.faceX-place.frontFlange?.fiberX,3);
 assert.equal(place.nominalDistance,50);
 assert.equal(place.contact.surface,'vertical-front');
 assert.equal(place.verified,false);
});
