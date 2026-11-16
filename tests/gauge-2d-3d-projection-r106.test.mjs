import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact} from '../backgauge-placement.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {machineGaugeProjection,gaugePerspectiveContours,
 machineSheetProjection,machineToolProjection} from '../machine-visual.js';

const screen=(p,cx,datumY,scale)=>[cx+p.x*scale,datumY-p.y*scale];
const same=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<1e-7;
const p=normalized({...EXAMPLE,stopByBend:[1,2,1,2]});
const view={cx:242,datumY:338,scale:1.32};

test('R106: mismo contorno frontal y contacto en plano métrico para Stop/Support',()=>{
 for(let op=0;op<p.order.length;op++)for(const phase of [.10,.38,.51,.70,.91,.985]){
  const scene=technicalScene(p,5*(op+phase));
  const stopNumber=p.stopByBend[scene.stage.activeBend];
  const placement=gaugePlacement(scene,stopNumber);
  const config=getActiveMachineConfig();
  const dimensions=stopNumber===2?config.support:config.stop;
  const g=machineGaugeProjection(placement,view.cx,view.datumY,view.scale);
  const inWorld=gaugeContourAtContact(placement,dimensions);
  assert.equal(g.outline.length,inWorld.length);
  assert.deepEqual(g.point,screen(placement.point,view.cx,view.datumY,view.scale));
  assert.deepEqual(g.outline,inWorld.map(q=>screen(q,view.cx,view.datumY,view.scale)));
  assert.ok(same(g.point,screen(scene.gaugeTransition?.point||
   scene.gaugeAnchor,view.cx,view.datumY,view.scale)));
  if(placement.contact){
   assert.deepEqual(g.face?.from,screen(placement.contact.from,
    view.cx,view.datumY,view.scale));
   assert.deepEqual(g.face?.to,screen(placement.contact.to,
    view.cx,view.datumY,view.scale));
   assert.deepEqual(g.contactPoint,screen(placement.contact.point,
    view.cx,view.datumY,view.scale));
  }
  assert.equal(g.verified,false);
 }
});

test('R106: la extrusión perspectiva NO mueve el contorno delantero del dedo',()=>{
 for(let stopNumber of [1,2]){
  const s=technicalScene({...p,stopByBend:[stopNumber,stopNumber,
   stopNumber,stopNumber]},5.1);
  const g=machineGaugeProjection(gaugePlacement(s,stopNumber),
   view.cx,view.datumY,view.scale);
  const profile=gaugePerspectiveContours(g.outline,view.scale,true);
  assert.deepEqual(profile.near,g.outline);
  assert.deepEqual(profile.depthX,23*view.scale);
  assert.deepEqual(profile.depthY,-13*view.scale);
  for(let i=0;i<profile.near.length;i++){
   assert.ok(Math.abs(profile.far[i][0]-profile.near[i][0]-
    profile.depthX)<1e-9);
   assert.ok(Math.abs(profile.far[i][1]-profile.near[i][1]-
    profile.depthY)<1e-9);
  }
  assert.deepEqual(gaugePerspectiveContours(g.outline,view.scale,false).near,
   g.outline);
 }
});

test('R106: chapa, matriz, punzón y tope comparten origen X/Y sin inventar desplazamiento',()=>{
 for(let op=0;op<p.order.length;op++){
  const scene=technicalScene(p,5*(op+.25));
  const stop=p.stopByBend[scene.stage.activeBend];
  const g=machineGaugeProjection(gaugePlacement(scene,stop),
   view.cx,view.datumY,view.scale);
  const sheet=machineSheetProjection(scene,view.cx,view.datumY,view.scale,true);
  const tools=machineToolProjection(scene,view.cx,view.datumY,view.scale);
  assert.deepEqual(sheet,scene.sheetDisplay.map(q=>screen(q,
   view.cx,view.datumY,view.scale)));
  assert.deepEqual(tools.die,scene.diePolygon.map(q=>screen(q,
   view.cx,view.datumY,view.scale)));
  assert.deepEqual(tools.punch,scene.punchPolygon.map(q=>screen(q,
   view.cx,view.datumY,view.scale)));
  assert.ok(Number.isFinite(g.point[0])&&Number.isFinite(g.point[1]));
 }
});

test('R106: transformación de dedo inválida no produce coordenadas fantasma',()=>{
 const placement={stopNumber:1,point:{x:30,y:1},contact:{
  origin:{x:30,y:0}}};
 for(const scale of [0,-1,NaN,Infinity])
  assert.throws(()=>machineGaugeProjection(placement,100,200,scale),/inválida/);
 assert.throws(()=>machineGaugeProjection({...placement,point:{x:NaN,y:1}},
  100,200,1),/inválido/);
});
