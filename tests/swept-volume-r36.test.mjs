import test from 'node:test';
import assert from 'node:assert/strict';
import {makePrism} from '../volume-engine.js';
import {sweptPrismAgainstStatic,sweptPrismPair,prismTranslation,
 translatePrism} from '../swept-volume.js';
import {scanVolumeTrajectory} from '../volume-trajectory-review.js';
import {EXAMPLE} from '../engine.js';

const r=(x1,y1,x2,y2)=>[
 {x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2},{x:x1,y:y2}];
const prism=(id,x1,y1,x2,y2,z1=-1,z2=1)=>
 makePrism(id,r(x1,y1,x2,y2),z1,z2);
test('barrido: detecta pieza que atraviesa obstáculo ENTRE poses sin tocar extremos',()=>{
 const left=prism('movil',-7,0,-5,2);
 const right=translatePrism(left,12);
 const obstacle=prism('obstaculo',-1,0,1,2);
 const hit=sweptPrismAgainstStatic(left,right,obstacle);
 assert.equal(hit.intersects,true);
 assert.equal(hit.unknown,false);
 assert.match(hit.reason,/ENTRE posiciones/);
});
test('barrido: no confunde volúmenes con igual X/Y pero Z separada',()=>{
 const left=prism('movil',-7,0,-5,2,-1,1);
 const right=translatePrism(left,12);
 const obstacle=prism('obstaculo',-1,0,1,2,2,4);
 const sweep=sweptPrismAgainstStatic(left,right,obstacle);
 assert.equal(sweep.intersects,false);
 assert.equal(sweep.unknown,false);
});
test('barrido relativo: dos cuerpos que avanzan juntos no colisionan',()=>{
 const sheet=prism('sheet',0,0,2,2);
 const punch=prism('punch',-6,0,-4,2);
 const hit=sweptPrismPair(sheet,translatePrism(sheet,12),
  punch,translatePrism(punch,12));
 assert.equal(hit.intersects,false);
 assert.equal(hit.unknown,false);
});
test('barrido: cambio de forma o giro sigue SIN RESOLVER',()=>{
 const a=prism('pieza',0,0,2,2);
 const shape=prism('pieza',0,0,3,2);
 assert.equal(prismTranslation(a,shape).ok,false);
 assert.equal(sweptPrismAgainstStatic(a,shape,prism('obstaculo',6,0,7,2)).unknown,true);
});
test('barrido: Z cruza el obstáculo ENTRE posiciones sin tocar extremos',()=>{
 const a=prism('dedo',0,0,2,2,-5,-3);
 const end=translatePrism(a,0,0,8);
 const body=prism('chapa',0,0,2,2,-1,1);
 const result=sweptPrismAgainstStatic(a,end,body);
 assert.equal(prismTranslation(a,end).ok,true);
 assert.equal(result.intersects,true);
 assert.equal(result.unknown,false);
 assert.ok(result.zWindow[0]>0&&result.zWindow[1]<1);
});
test('barrido: X/Z simultáneos sin coincidencia TEMPORAL no se clasifican como colisión',()=>{
 const a=prism('dedo',-7,0,-5,2,-10,-8);
 const end=translatePrism(a,12,0,10);
 const body=prism('chapa',-4,0,-3,2,-1,1);
 const result=sweptPrismAgainstStatic(a,end,body);
 assert.equal(result.intersects,false);
 assert.equal(result.unknown,false);
});
test('barrido: dos cuerpos que se acercan en Z se encuentran en el tramo',()=>{
 const a=prism('dedo',0,0,2,2,-6,-4);
 const b=prism('chapa',0,0,2,2,4,6);
 const check=sweptPrismPair(a,translatePrism(a,0,0,6),
  b,translatePrism(b,0,0,-6));
 assert.equal(check.intersects,true);
 assert.equal(check.unknown,false);
});
test('trayectoria: el escáner presenta penetración intermedia y no certifica CNC',()=>{
 const sheet=prism('sheet',-.5,0,.5,1);
 const fixed={
  bed:prism('bed',100,0,101,1),
  gauge:prism('gauge',100,0,101,1),
  punch:prism('punch',100,0,101,1),
  die:prism('die',100,0,101,1)
 };
 const scan=scanVolumeTrajectory(EXAMPLE,{
  samplesPerOperation:4,axisMotion:null,
  inspect:(_p,time)=>{
   const x=time<1?-6:6;
   return {issues:[],model:{sheet:[sheet],
    objects:{...fixed,ram:prism('ram',x-1,0,x+1,1)}}};
  }
 });
 assert.ok(scan.linearSweptPenetrations>0);
 assert.ok(scan.operations.some(row=>row.findings.some(f=>
  f.kind==='ram'&&f.severity==='penetracion-barrido-lineal-modelado')));
 assert.equal(scan.canApproveForMachine,false);
 assert.equal(scan.continuousCollisionVerified,false);
});
test('trayectoria: deformación no rígida informa barrido AABB no resuelto',()=>{
 const fixed={
  bed:prism('bed',100,0,101,1),gauge:prism('gauge',100,0,101,1),
  punch:prism('punch',100,0,101,1),die:prism('die',100,0,101,1),
  ram:prism('ram',0,0,2,2)
 };
 const scan=scanVolumeTrajectory(EXAMPLE,{
  samplesPerOperation:4,axisMotion:null,
  inspect:(_p,time)=>({issues:[],model:{objects:fixed,
   sheet:[prism('sheet',time<1?-8:8,0,time<1?-6:11,1)]}})
 });
 assert.ok(scan.uncertainSweptIntervals>0);
 assert.ok(scan.operations.some(row=>row.findings.some(f=>
  f.severity==='intervalo-barrido-no-resuelto')));
 assert.equal(scan.linearSweptPenetrations,0);
});
