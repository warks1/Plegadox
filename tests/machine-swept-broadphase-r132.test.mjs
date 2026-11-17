import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePrism} from '../volume-engine.js';
import {translatePrism,sweptPrismPair} from '../swept-volume.js';
import {movingPrismBounds,sweptBroadphase} from '../machine-swept-broadphase-r132.js';
import {EXAMPLE} from '../engine.js';
import {V85_FACTORY} from '../machine-config.js';
import {technicalScene} from '../technical-section.js';
import {machineConfigurationKey} from '../machine-cad.js';
import {motionPieceKey} from '../machine-axis-motion.js';
import {scanAxisCADMovement} from '../machine-axis-geometry.js';
import {scanVolumeTrajectory} from '../volume-trajectory-review.js';
import {CAD_EVIDENCE_SOURCES,cadSourceFor} from '../cad-evidence.js';
import {listCadImportSources} from '../cad-import-sources.js';

const rect=(x,y,width=2,height=2)=>[
 {x,y},{x:x+width,y},{x:x+width,y:y+height},{x,y:y+height}];
const prism=(name,x,y,zMin=-10,zMax=10)=>
 makePrism(name,rect(x,y),zMin,zMax,'perfil CAD importado DXF_ASCII_MM · ENSAYO');
const from=prism('movil',-12,0),to=translatePrism(from,30,0,0);
const target=prism('fijo',0,0);
test('R132: AABB barrido descarta separaciones X/Y/Z sin usar triangulacion CAD',()=>{
 const x=sweptBroadphase(from,translatePrism(from,-2,0,0),target,target);
 assert.equal(x.mayOverlap,false);
 assert.equal(x.separatingAxis,'X');
 const y=sweptBroadphase(prism('uno',0,20),prism('uno',0,30),target,target);
 assert.equal(y.mayOverlap,false);
 assert.equal(y.separatingAxis,'Y');
 const z=sweptBroadphase(prism('uno',0,0,30,50),prism('uno',0,0,45,65),
  target,target);
 assert.equal(z.mayOverlap,false);
 assert.equal(z.separatingAxis,'Z');
 assert.equal(z.certified,false);
 const bounds=movingPrismBounds(from,to);
 assert.deepEqual([bounds.minX,bounds.maxX],[-12,20]);
});
test('R132: conserva choque DURANTE un trayecto aunque ambos extremos esten libres',()=>{
 const a=sweptBroadphase(from,to,target,target);
 assert.equal(a.mayOverlap,true);
 const swept=sweptPrismPair(from,to,target,target);
 assert.equal(swept.intersects,true);
 assert.match(swept.reason,/ENTRE posiciones/);
});
test('R132: AABB solapado NO demuestra choque; triangulacion detallada decide',()=>{
 const a=prism('movil',0,0),b=translatePrism(a,20,20,0);
 const c=prism('fijo',0,20);
 assert.equal(sweptBroadphase(a,b,c,c).mayOverlap,true);
 assert.equal(sweptPrismPair(a,b,c,c).intersects,false);
});
test('R132: chapon girado/deformado no permite descarte por AABB de extremos',()=>{
 const before=prism('pieza',-50,-50);
 const deformed=makePrism('pieza',rect(-40,-40,5,2),-10,10,
  'malla de chapa no rigida');
 const away=prism('elemento',100,100);
 assert.equal(movingPrismBounds(before,deformed),null);
 const screen=sweptBroadphase(before,deformed,away,away);
 assert.equal(screen.mayOverlap,true);
 assert.equal(screen.known,false);
 assert.equal(sweptPrismPair(before,deformed,away,away).unknown,true);
});
test('R132: contacto tangente y holgura numericamente despreciable NO se descartan',()=>{
 const one=prism('a',0,0);
 const touching=prism('b',2,0);
 const near=prism('b',2+1e-9,0);
 assert.equal(sweptBroadphase(one,one,touching,touching).mayOverlap,true);
 assert.equal(sweptBroadphase(one,one,near,near).mayOverlap,true);
 const separated=prism('b',2.01,0);
 assert.equal(sweptBroadphase(one,one,separated,separated).mayOverlap,false);
});
test('R132: CAD invalido permanece SIN RESOLVER, no se omite por optimizacion',()=>{
 const invalid={id:'sin-cad',valid:false};
 const r=sweptBroadphase(invalid,to,target,target);
 assert.equal(r.mayOverlap,true);
 assert.equal(r.known,false);
 assert.equal(sweptPrismPair(invalid,to,target,target).unknown,true);
});
test('R132: matriz Eurostamp 3163 y 3165 en catálogo de DXF sin importar',()=>{
 for(const [ref,v] of [['3163',16],['3165',25]]){
  const entries=cadSourceFor('die','EUROSTAMP',ref);
  assert.equal(entries.length,1,ref);
  const e=entries[0];
  assert.equal(e.dimensions.vOpeningMm,v);
  assert.equal(e.dimensions.heightMm,60);
  assert.equal(e.dimensions.angleDeg,88);
  assert.equal(e.cadUrl,'https://eurostampsrl.it/dxf/'+ref+'.dxf');
  assert.equal(e.status,'ENLACE_CONFIRMADO_NO_IMPORTADO');
  assert.equal(e.datum,'OEM_REFERENCE_UNCONFIRMED');
 }
 assert.equal(cadSourceFor('punch','EUROSTAMP','1015').length,1,
  'Punzón 1015 ya existente: no duplicar');
 const importable=listCadImportSources({punches:[],dies:[],
  evidence:CAD_EVIDENCE_SOURCES.filter(v=>['3163','3165'].includes(v.reference))});
 assert.equal(importable.length,2);
 assert.ok(importable.every(x=>x.tool.cadStatus==='ENLACE_NO_IMPORTADO'&&
  x.tool.verifiedSpecs===false&&x.tool.length===null));
});
const machine=V85_FACTORY;
const key=machineConfigurationKey(machine);
const axes={Y1:0,Y2:0,X:10,R:10,Z1:0,Z2:0};
const limits=Object.fromEntries(['Y1','Y2','X','R','Z1','Z2']
 .map(k=>[k,{min:-3000,max:3000,maxSpeed:800}]));
const fixture=()=>{
 const tip=technicalScene(EXAMPLE,0).kinematics.tipHeight;
 const cad=(kind,offsetX,offsetY)=>({
  kind,source:'DXF de prueba r132, no OEM',machineConfigKey:key,
  points:[[-10,0],[10,0],[10,10],[-10,10]],
  offsetX,offsetY,zMin:-15,zMax:15});
 return {ram:cad('ram',0,100-tip),bed:cad('bed',0,0),
  stop:cad('stop',150,0),upperClamp:cad('upperClamp',40,100-tip)};
};
const mapping={unit:'mm',version:1,
 signs:{Y:-1,X:1,R:1,Z1:1,Z2:1},
 activeFinger:'Z1',referenceSceneTime:0,ramTiltTolerance:0,
 source:'Datum para prueba, no calibracion fisica',machineConfigKey:key};
const motion={unit:'mm',timeUnit:'s',source:'programmed',
 sourceDescription:'Prueba geometricamente sintetica R132',
 machineId:'V85',pieceKey:motionPieceKey(EXAMPLE),limits,
 poses:[{time:0,sceneTime:0,axes},{time:5,sceneTime:0,
  axes:{...axes,Y1:200,Y2:200}}]};
test('R132: motor conserva choque trancha/mesa y descarta parejas claramente lejanas',()=>{
 const review=scanAxisCADMovement(EXAMPLE,{
  machine,machineCAD:fixture(),mapping,axisMotion:motion});
 assert.equal(review.checked,true);
 assert.ok(review.events.some(e=>e.moving==='ram'&&e.against==='bed'));
 assert.ok(review.broadphaseRejectedPairs>0);
 assert.ok(review.narrowphasePairsChecked>0);
 assert.equal(review.broadphaseRejectedPairs,
  review.coverage.broadphaseRejectedPairs);
 assert.equal(review.canApproveForMachine,false);
});
test('R132: informe del volumen acumula descartes sin sustituir la inspeccion precisa',()=>{
 const report=scanVolumeTrajectory(EXAMPLE,{
  machine,machineCAD:fixture(),axisMotion:motion,axisMapping:mapping,
  samplesPerOperation:4
 });
 assert.equal(report.axisGeometry.checked,true);
 assert.ok(report.axisGeometry.broadphaseRejectedPairs>0);
 assert.ok(report.broadphaseRejectedSweeps>=0);
 assert.ok(report.narrowphaseSweeps>=0);
 assert.equal(report.canApproveForMachine,false);
});
test('R132: PWA incluye filtro en caché y UI expone estadísticas de descartes',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../machine-cad-ui.js',import.meta.url),'utf8');
 assert.match(ui,/broadphaseRejectedPairs/);
 assert.ok(sw.includes('"./machine-swept-broadphase-r132.js"'));
 assert.ok(html.includes('id="machineAxisFindings"'));
});
