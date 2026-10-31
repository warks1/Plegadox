import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {machineSheetProjection} from '../machine-visual.js';
test('Diagnóstico cuantitativo 09:33: saltos en bordes de golpe y cambio de tope sin reescribir pieza',()=>{
 const p=normalized(EXAMPLE),snap=structuredClone(p);
 const times=[4.1999,4.2,4.9999,5,9.1999,9.2,9.9999,10,
  14.1999,14.2,14.9999,15,19.1999,19.2,19.9999,20];
 let peaks=[];
 for(let i=0;i<times.length;i+=2){
  const s=technicalScene(p,times[i]),t=technicalScene(p,times[i+1]);
  const gap=Math.max(...s.sheet.map((pt,k)=>Math.hypot(pt.x-t.sheet[k].x,pt.y-t.sheet[k].y)));
  const deltaTip=Math.abs(s.kinematics.tipHeight-t.kinematics.tipHeight);
  const p2=machineSheetProjection(s,200,350,1,true);
  const p3=machineSheetProjection(t,200,350,1,true);
  assert.equal(p2.length,s.sheetDisplay.length);
  assert.equal(p3.length,t.sheetDisplay.length);
  assert.ok(Number.isFinite(gap)&&Number.isFinite(deltaTip));
  peaks.push({from:times[i],to:times[i+1],maxShiftMm:Math.round(gap*100)/100,
   punchShiftMm:Math.round(deltaTip*100)/100,
   phaseFrom:s.stage.phase,phaseTo:t.stage.phase});
 }
 console.log('DIAGNOSTICO_CAMBIO_GOLPES_0933',JSON.stringify(peaks));
 assert.deepEqual(p,snap);
});

test('Diagnóstico coordenadas de saltos: extremo, pivote, reflejo y pliegue activo',()=>{
 const p=normalized(EXAMPLE);
 for(const [a,b] of [[4.9999,5],[9.9999,10],[14.9999,15]]){
  const one=technicalScene(p,a),two=technicalScene(p,b);
  const brief=m=>({phase:m.stage.phase,bend:m.stage.activeBend,
   mirror:m.feedMirrored,side:m.gaugeReference.side,
   points:m.sheet.map((q,i)=>[i,Math.round(q.x*100)/100,Math.round(q.y*100)/100]),
   raw:m.presentation.points.map(q=>[Math.round(q.x*100)/100,Math.round(q.y*100)/100]),
   tip:m.kinematics.tipHeight});
  console.log('DIAGNOSTICO_EXTREMOS_0933',JSON.stringify({a,b,one:brief(one),two:brief(two)}));
 }
});

test('Reparación 09:33: no teletransportar alas ni punzón entre golpes (1-2-4-3)',()=>{
 const p=normalized(EXAMPLE),before=structuredClone(p);
 for(const [left,right] of [[4.9999,5],[9.9999,10],[14.9999,15]]){
  const a=technicalScene(p,left),b=technicalScene(p,right);
  assert.equal(a.sheet.length,b.sheet.length);
  const delta=Math.max(...a.sheet.map((pt,i)=>
   Math.hypot(pt.x-b.sheet[i].x,pt.y-b.sheet[i].y)));
  const punch=Math.abs(a.kinematics.tipHeight-b.kinematics.tipHeight);
  assert.ok(delta<.2,'Salto de chapa '+delta+' mm en t='+right+' s');
  assert.ok(punch<1.5,'Salto de punzón '+punch+' mm en t='+right+' s');
  const viewA=machineSheetProjection(a,0,0,1,true);
  const viewB=machineSheetProjection(b,0,0,1,true);
  const visual=Math.max(...viewA.map((pt,i)=>
   Math.hypot(pt[0]-viewB[i][0],pt[1]-viewB[i][1])));
  assert.ok(visual<.2,'La vista tampoco puede saltar '+visual+' mm en t='+right);
 }
 assert.deepEqual(p,before,'No cambiar programas/topes para ocultar el fallo');
});
