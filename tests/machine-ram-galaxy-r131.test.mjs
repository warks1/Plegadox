import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canvasRenderSize} from '../machine-canvas-memory-r131.js';
import {renderBudget} from '../adaptive-render-budget.js';
import {createSolidFrameCache} from '../machine-solid-frame-cache.js';
import {assessRamYTilt} from '../machine-ram-tilt-evidence-r131.js';
import {classifyAxisContact} from '../machine-axis-evidence.js';
import {EXAMPLE} from '../engine.js';
import {V85_FACTORY} from '../machine-config.js';
import {technicalScene} from '../technical-section.js';
import {machineConfigurationKey} from '../machine-cad.js';
import {motionPieceKey} from '../machine-axis-motion.js';
import {scanAxisCADMovement} from '../machine-axis-geometry.js';

test('R131: Galaxy eco y máxima resolución mantienen límite de megapíxeles',()=>{
 const budget=renderBudget({width:2560,height:1600,dpr:3,android:true},'auto');
 assert.equal(budget.tier,'eco');
 assert.equal(budget.maxCanvasPixels,1200000);
 assert.equal(budget.maxCachedFrames,2);
 const pixels=canvasRenderSize(2560,1600,budget.dpr,budget.maxCanvasPixels);
 assert.equal(pixels.capped,true);
 assert.ok(pixels.pixelCount<=1200000);
 assert.ok(pixels.approximateBytes<=4800000);
 assert.ok(Math.abs(pixels.width/2560-pixels.height/1600)<.002);
 const high=renderBudget({width:3200,height:1800,dpr:3,android:true},'high');
 const UHD=canvasRenderSize(3200,1800,high.dpr,high.maxCanvasPixels);
 assert.equal(UHD.capped,true);
 assert.ok(UHD.pixelCount<=3600000);
 assert.ok(UHD.approximateBytes<=14400000);
 const normal=canvasRenderSize(640,400,1,1200000);
 assert.equal(normal.capped,false);
 assert.equal(normal.width,640);
 assert.equal(normal.height,400);
});
test('R131: caché LRU recupera golpes revisitados y limita memoria Galaxy',()=>{
 let builds=0;
 const piece={name:'omega'};
 const cache=createSolidFrameCache((p,t,l)=>({p,t,l,id:++builds}),{capacity:2});
 const a=cache.get(piece,0,1200),b=cache.get(piece,6,1200);
 assert.equal(cache.get(piece,0,1200),a);
 assert.equal(builds,2);
 assert.equal(cache.stats.hits,1);
 const c=cache.get(piece,12,1200);
 assert.equal(builds,3);
 assert.equal(cache.stats.entries,2);
 assert.equal(cache.get(piece,0,1200),a);
 assert.notEqual(cache.get(piece,6,1200),b);
 assert.equal(cache.stats.capacity,2);
 assert.ok(cache.stats.evictions>0);
 cache.setCapacity(1);
 assert.equal(cache.stats.entries,1);
 cache.invalidate();
 assert.equal(cache.stats.entries,0);
 assert.notEqual(cache.get(piece,12,1200),c);
 assert.throws(()=>cache.setCapacity(20),/1 a 8/);
 const fail=createSolidFrameCache(()=>{throw Error('No se creó la escena')});
 assert.throws(()=>fail.get(piece,0,1200),/No se creó/);
 assert.equal(fail.stats.entries,0);
});
test('R131: diferencia Y1/Y2 conocida no se oculta por la media de cilindros',()=>{
 const ref={Y1:0,Y2:0},a={Y1:0,Y2:0},b={Y1:2,Y2:0};
 const approx=assessRamYTilt(a,b,ref,3);
 assert.equal(approx.known,true);
 assert.equal(approx.hasUnmodeledTilt,true);
 assert.equal(approx.maxDifferentialMm,2);
 assert.equal(approx.meanApproximationErrorMm,1);
 assert.equal(approx.exceedsTolerance,false);
 assert.equal(approx.physicalTiltModeled,false);
 const blocked=assessRamYTilt(a,b,ref,.5);
 assert.equal(blocked.exceedsTolerance,true);
 const baseline=assessRamYTilt({Y1:11,Y2:9},{Y1:12,Y2:10},
  {Y1:10,Y2:8},.1);
 assert.equal(baseline.maxDifferentialMm,0);
 assert.equal(baseline.hasUnmodeledTilt,false);
 assert.equal(assessRamYTilt(a,b,{Y1:null,Y2:0},3).known,false);
});
test('R131: dos CAD importados no aparentan precisión física con Y1/Y2 desiguales',()=>{
 const a='perfil CAD importado DXF_ASCII_MM · trancha',b='perfil CAD importado DXF_ASCII_MM · mesa';
 assert.equal(classifyAxisContact(a,b).code,'DOS_PERFILES_CAD');
 const approximate=classifyAxisContact(a,b,{upperAssemblyYApproximationMm:1.2});
 assert.equal(approximate.code,'GEOMETRIA_PROVISIONAL');
 assert.equal(approximate.upperAssemblyTiltUnmodeled,true);
 assert.match(approximate.label,/1\.200 mm/);
 assert.equal(approximate.physicalCollisionCertified,false);
});
const machine=V85_FACTORY,key=machineConfigurationKey(machine);
const names=['Y1','Y2','X','R','Z1','Z2'];
const limits=Object.fromEntries(names.map(n=>[n,{min:-3000,max:3000,maxSpeed:500}]));
const fixture=()=>{
 const tip=technicalScene(EXAMPLE,0).kinematics.tipHeight;
 const cad=(kind,offsetX,offsetY)=>({
  kind,source:'Ensayo CAD R131 NO OEM',machineConfigKey:key,
  points:[[-10,0],[10,0],[10,10],[-10,10]],
  offsetX,offsetY,zMin:-15,zMax:15});
 return {ram:cad('ram',0,100-tip),bed:cad('bed',0,0),
  stop:cad('stop',150,0)};
};
const mapping=()=>({unit:'mm',version:1,
 signs:{Y:-1,X:1,R:1,Z1:1,Z2:1},activeFinger:'Z1',
 referenceSceneTime:0,ramTiltTolerance:3,
 source:'Datum de prueba no OEM',machineConfigKey:key});
const motion=(Y1=200,Y2=198)=>({
 unit:'mm',timeUnit:'s',source:'recorded',
 sourceDescription:'Ensayo independiente NO CNC real',
 machineId:'V85',pieceKey:motionPieceKey(EXAMPLE),limits,
 poses:[
  {time:0,sceneTime:0,axes:{Y1:0,Y2:0,X:10,R:10,Z1:0,Z2:0}},
  {time:5,sceneTime:0,axes:{Y1,Y2,X:10,R:10,Z1:0,Z2:0}}
 ]
});
test('R131: barrido de trancha Y1/Y2 desigual degrada solapes CAD-CAD a advertencia',()=>{
 const scan=scanAxisCADMovement(EXAMPLE,{machine,machineCAD:fixture(),
  mapping:mapping(),axisMotion:motion()});
 assert.equal(scan.checked,true,scan.status);
 assert.equal(scan.ramTiltApproximatedIntervals,1);
 assert.equal(scan.ramTiltApproximationMaxMm,1);
 assert.equal(scan.ramIndependentYGeometryModeled,false);
 assert.ok(scan.unknown.some(v=>v.includes('1.000 mm')));
 const ramBed=scan.events.find(v=>v.moving==='ram'&&v.against==='bed');
 assert.ok(ramBed);
 assert.equal(ramBed.evidenceCode,'GEOMETRIA_PROVISIONAL');
 assert.equal(ramBed.upperAssemblyTiltUnmodeled,true);
 assert.equal(ramBed.upperAssemblyYApproximationMm,1);
 assert.equal(ramBed.physicalCollisionCertified,false);
 assert.equal(scan.coverage.ramTiltApproximatedIntervals,1);
 assert.equal(scan.canApproveForMachine,false);
});
test('R131: Y fuera de tolerancia deja el intervalo SIN RESOLVER',()=>{
 const scan=scanAxisCADMovement(EXAMPLE,{machine,machineCAD:fixture(),
  mapping:mapping(),axisMotion:motion(210,200)});
 assert.equal(scan.tiltUnresolved,1);
 assert.equal(scan.intervalsChecked,0);
 assert.equal(scan.events.length,0);
 assert.equal(scan.checked,false);
});
test('R131: vista PWA utiliza presupuesto y registra modelo de Y diferencial',()=>{
 const js=readFileSync(new URL('../machine-volume-viewer.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(js,/canvasRenderSize/);
 assert.match(js,/maxCachedFrames/);
 assert.match(sw,/"\.\/machine-canvas-memory-r131\.js"/);
 assert.match(sw,/"\.\/machine-ram-tilt-evidence-r131\.js"/);
});
