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

test('entre golpes el dedo cambia su referencia de forma continua sin retirar si no hace falta',async()=>{
 const {gaugePlacement,gaugeContourAtContact}=await import('../backgauge-placement.js');
 const {V85_FACTORY}=await import('../machine-config.js');
 const p=normalized(EXAMPLE);
 for(const boundary of [5,10,15]){
  const before=technicalScene(p,boundary-.0001);
  const after=technicalScene(p,boundary);
  const a=gaugePlacement(before,1),b=gaugePlacement(after,1);
  const delta=Math.hypot(a.point.x-b.point.x,a.point.y-b.point.y);
  assert.ok(delta<.2,'Salto de '+delta+' mm del tope en '+boundary+' s');
  assert.equal(a.contactEngaged,false,'No dar contacto en el traslado');
  const scene=technicalScene(p,boundary-.4);
  assert.ok(scene.gaugeTransition,'Debe haber una transición X/R entre golpes');
  assert.deepEqual(scene.gaugeTransition.from,scene.gaugeAnchor,
   'El origen del dedo pertenece a la cota anterior, no al giro de la chapa');
  if(scene.gaugePlan.enabled){
   assert.ok(scene.gaugeTransition.plannedRetraction>0,
    'Interferencia futura: el dedo debe despejar antes de plegar');
   assert.ok(scene.gaugeTransition.parkPoint.x>=scene.gaugeTransition.from.x);
  }else{
   assert.equal(scene.gaugeTransition.plannedRetraction,0,
    'Sin riesgo 2D, no inventar movimiento de aparcamiento');
   assert.equal(scene.gaugeTransition.phase,'reubicacion-siguiente-golpe');
  }
  assert.equal(gaugeContourAtContact(a,V85_FACTORY.stop).length,6);
 }
 assert.deepEqual(p.order,[0,1,3,2]);assert.deepEqual(p.angles,[90,-90,-90,90]);
});

test('el origen X/R nunca sigue la chapa; replegar sólo si el barrido predice interferencia',async()=>{
 const p=normalized(EXAMPLE);
 const {gaugePlacement}=await import('../backgauge-placement.js');
 const close=(a,b,eps=1e-6)=>Math.hypot(a.x-b.x,a.y-b.y)<eps;
 for(const boundary of [5,10,15]){
  const t=raw=>boundary-.8+Math.max(raw,1e-5)*.8;
  const start=technicalScene(p,t(0)),origin=start.gaugeAnchor;
  assert.equal(start.stage.phase,'Reposicionamiento');
  const trajectory=[];
  for(const raw of [0,.12,.22,.3,.4,.5,.6,.7,.78,.9,1-1e-5]){
   const scene=technicalScene(p,t(raw));
   assert.ok(scene.gaugeTransition,'No debe desaparecer la transición en raw '+raw);
   assert.ok(close(scene.gaugeAnchor,origin),'La cota X/R cambió durante giro '+boundary);
   assert.ok(close(scene.gaugeTransition.from,origin),
    'La trayectoria cambió su origen sin control');
   const place=gaugePlacement(scene,2);
   assert.equal(place.contactEngaged,false);
   trajectory.push({raw,...scene.gaugeTransition});
  }
  const planned=start.gaugePlan.enabled;
  if(planned){
   const middle=trajectory.filter(x=>x.raw>=.3&&x.raw<=.7);
   const parkedX=middle[0].point.x;
   assert.ok(middle.every(x=>Math.abs(x.point.x-parkedX)<1e-6),
    'Dedo deriva durante cambio de cara sin demanda de X');
   assert.ok(parkedX>=Math.max(origin.x,middle[0].to.x)+12-1e-6,
    'Aparcamiento insuficiente respecto al siguiente punto de tope');
   const outgoing=trajectory.filter(x=>x.raw<=.22).map(x=>x.point.x);
   const returning=trajectory.filter(x=>x.raw>=.78).map(x=>x.point.x);
   assert.ok(outgoing.every((x,i)=>i===0||x>=outgoing[i-1]-1e-6));
   assert.ok(returning.every((x,i)=>i===0||x<=returning[i-1]+1e-6));
  }else{
   // La nueva cota puede estar a la izquierda o a la derecha: no
   // confundir reposicionamiento directo con retirada anticolisión.
   assert.ok(trajectory.every(x=>x.plannedRetraction===0));
   assert.ok(trajectory.every(x=>x.phase==='reubicacion-siguiente-golpe'));
   const xs=trajectory.map(x=>x.point.x),direction=Math.sign(xs.at(-1)-xs[0]);
   assert.ok(xs.every((x,i)=>i===0||direction*(x-xs[i-1])>=-1e-6),
    'Reposicionamiento sin retroceso adicional ni rebote');
  }
 }
});

