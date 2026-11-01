import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {machineSheetProjection} from '../machine-visual.js';

test('secuencia omega 1-2-4-3: continuidad a ambos lados de cada cambio de golpe',()=>{
 const p=normalized(EXAMPLE),before=structuredClone(p);
 assert.deepEqual(p.order,[0,1,3,2]);
 assert.deepEqual(p.angles,[90,-90,-90,90]);
 for(const [left,right] of [[4.9999,5],[9.9999,10],[14.9999,15]]){
  const a=technicalScene(p,left),b=technicalScene(p,right);
  assert.equal(a.sheet.length,b.sheet.length);
  const delta=Math.max(...a.sheet.map((pt,i)=>
   Math.hypot(pt.x-b.sheet[i].x,pt.y-b.sheet[i].y)));
  const tip=Math.abs(a.kinematics.tipHeight-b.kinematics.tipHeight);
  assert.ok(delta<.2,'Salto de '+delta+' mm en '+right+' s');
  assert.ok(tip<1.5,'Salto de punzón '+tip+' mm en '+right+' s');
  const va=machineSheetProjection(a,0,0,1,true),
        vb=machineSheetProjection(b,0,0,1,true);
  assert.ok(va.length>1&&vb.length>1);
  const head=va[0],other=vb[0];
  assert.ok(Math.hypot(head[0]-other[0],head[1]-other[1])<.2,
   'Extremo de chapa discontinuo en '+right);
 }
 assert.deepEqual(p,before,'La previsualización nunca cambia el programa');
});
test('la geometría del visor no depende del modo perspectiva al cambiar de cara',()=>{
 for(const t of [4.2,4.6,4.9999,5,9.4,9.9999,10,14.4,14.9999,15]){
  const scene=technicalScene(EXAMPLE,t);
  assert.deepEqual(machineSheetProjection(scene,0,0,1,true),
   machineSheetProjection(scene,0,0,1,false),'Vista diferente en '+t);
 }
});

test('al cambiar pliegue el tope X/R retrocede, se traslada y no da saltos de posición',async()=>{
 const {gaugePlacement,gaugeContourAtContact}=await import('../backgauge-placement.js');
 const {V85_FACTORY}=await import('../machine-config.js');
 const p=normalized(EXAMPLE);
 for(const boundary of [5,10,15]){
  const before=technicalScene(p,boundary-.0001);
  const after=technicalScene(p,boundary);
  const a=gaugePlacement(before,1),b=gaugePlacement(after,1);
  const delta=Math.hypot(a.point.x-b.point.x,a.point.y-b.point.y);
  assert.ok(delta<.2,'Salto de '+delta+' mm del tope en '+boundary+' s');
  assert.equal(a.contactEngaged,false,'Dedo debe separarse durante cambio');
  const scene=technicalScene(p,boundary-.4);
  assert.ok(scene.gaugeTransition,'Debe existir una trayectoria de tope entre golpes');
  assert.ok(scene.gaugeTransition.point.x>=scene.gaugeTransition.from.x-1e-6,
   'El dedo debe retirarse hacia atrás, lejos de la chapa');
  const outline=gaugeContourAtContact(a,V85_FACTORY.stop);
  assert.equal(outline.length,6,'El tope completo se traslada rígido');
 }
 assert.deepEqual(p.order,[0,1,3,2]);
 assert.deepEqual(p.angles,[90,-90,-90,90]);
});

test('origen X/R fijo durante el giro de la chapa: el tope no invierte ni modifica su retirada',async()=>{
 const p=normalized(EXAMPLE);
 const {gaugePlacement}=await import('../backgauge-placement.js');
 for(const boundary of [5,10,15]){
  const t=raw=>boundary-.8+raw*.8;
  const start=technicalScene(p,t(0)),initial=start.gaugeAnchor;
  assert.equal(start.stage.phase,'Reposicionamiento');
  // El tramo intermedio es donde antes spin=cos(pi*u) hacía variar
  // el anclaje del dedo con el giro de la chapa.
  for(const raw of [0,.12,.22,.3,.4,.5,.6,.7,.78,.9,1-1e-5]){
   const scene=technicalScene(p,t(raw));
   assert.ok(scene.gaugeTransition,'Falta traslación de tope con raw='+raw);
   assert.ok(Math.hypot(scene.gaugeAnchor.x-initial.x,
     scene.gaugeAnchor.y-initial.y)<1e-7,
    'El anclaje X/R salta al girar la chapa: golpe '+boundary+' raw='+raw);
   assert.ok(Math.hypot(scene.gaugeTransition.from.x-initial.x,
     scene.gaugeTransition.from.y-initial.y)<1e-7,
    'La trayectoria cambia el origen del tope a mitad de la retirada');
   const place=gaugePlacement(scene,2);
   assert.equal(place.contactEngaged,false,'Sin contacto verde durante el traslado');
   assert.equal(place.moving,true);
  }
  // Tras retirar, X permanece fija mientras gira la chapa.
  const middle=[.3,.4,.5,.6,.7].map(raw=>technicalScene(p,t(raw)).gaugeTransition);
  const withdrawnX=middle[0].point.x;
  assert.ok(middle.every(x=>Math.abs(x.point.x-withdrawnX)<1e-7),
   'El dedo deriva en X mientras la chapa cambia de cara');
  assert.ok(withdrawnX>=Math.max(initial.x,middle[0].to.x)+11.99,
   'El dedo no alcanza el despeje geométrico programado');
  // En ambas mitades de la trayectoria la X avanza sin retrocesos.
  const takeoff=[0,.05,.1,.15,.22].map(raw=>technicalScene(p,t(raw)).gaugeTransition.point.x);
  const approach=[.78,.83,.9,.95,1-1e-5].map(raw=>technicalScene(p,t(raw)).gaugeTransition.point.x);
  assert.ok(takeoff.every((x,i)=>!i||x>=takeoff[i-1]-1e-7),
   'El tope debe retirarse siempre hacia atrás en X positivo');
  assert.ok(approach.every((x,i)=>!i||x<=approach[i-1]+1e-7),
   'El tope debe regresar hacia la nueva referencia sin rebotes');
 }
});
