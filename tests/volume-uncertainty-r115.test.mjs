import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {scanVolumeTrajectory} from '../volume-trajectory-review.js';
import {reconcileVolumeEvidence} from '../planner-evidence-integrity.js';

const piece=normalized({...EXAMPLE,flanges:[60,80],angles:[90],order:[0]});
const issue=(kind,severity)=>({kind,severity,segment:0,volumeMm3:null,
 evidence:'CONTORNO SINTETICO',verified:false});
test('R115: barrido desconocido no se presenta como colisión de trancha',()=>{
 const r=scanVolumeTrajectory(piece,{
  inspect:()=>({issues:[issue('ram','intervalo-barrido-no-resuelto')],model:null}),
  samplesPerOperation:4
 });
 assert.equal(r.modeledMachineWarnings,0);
 assert.equal(r.ramWarnings,0);
 assert.equal(r.byKind.ram,0);
 assert.equal(r.unresolvedGeometryFindings,r.framesChecked,
  'Cada pose no resuelta debe conservarse, no esconderse en el primer diagnóstico');
 const e=reconcileVolumeEvidence(r);
 assert.equal(e.modeledMachineWarnings,0);
 assert.ok(e.uncertainSweptIntervals>0);
});
test('R115: geometría inválida queda pendiente sin falsa penetración',()=>{
 const r=scanVolumeTrajectory(piece,{
  inspect:()=>({issues:[issue('upperClamp','geometria-invalida')],model:null}),
  samplesPerOperation:4
 });
 assert.equal(r.modeledMachineWarnings,0);
 assert.equal(r.byKind.upperClamp,0);
 assert.equal(r.unresolvedGeometryFindings,r.framesChecked,
  'Cada pose no resuelta debe conservarse, no esconderse en el primer diagnóstico');
});
test('R115: penetración posterior sustituye el primer diagnóstico incompleto',()=>{
 let frame=0;
 const r=scanVolumeTrajectory(piece,{
  inspect:()=>({issues:[issue('ram',frame++<2?'geometria-invalida':
   'interferencia-envolvente')],model:null}),
  samplesPerOperation:4
 });
 assert.equal(r.operations[0].findings[0].severity,'interferencia-envolvente');
 assert.equal(r.ramWarnings,1);
 assert.equal(r.modeledMachineWarnings,1);
});
test('R115: contacto modelado de punzón no se cuenta como choque de trancha',()=>{
 const r=scanVolumeTrajectory(piece,{
  inspect:()=>({issues:[issue('punch','contacto-o-penetracion-posible')],model:null}),
  samplesPerOperation:4
 });
 assert.equal(r.punchVolumeContacts,1);
 assert.equal(r.modeledMachineWarnings,0);
 assert.equal(r.ramWarnings,0);
});
test('R115: penetración en barrido lineal prevalece sobre incertidumbre AABB',()=>{
 let frame=0;
 const r=scanVolumeTrajectory(piece,{
  inspect:()=>({issues:[issue('gauge',frame++<2?'intervalo-barrido-no-resuelto':
   'penetracion-barrido-lineal-modelado')],model:null}),
  samplesPerOperation:4
 });
 assert.equal(r.operations[0].findings[0].severity,'penetracion-barrido-lineal-modelado');
 assert.equal(r.byKind.gauge,1);
 assert.ok(r.modeledMachineWarnings>0);
});
