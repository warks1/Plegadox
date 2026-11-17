import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePrism} from '../volume-engine.js';
import {sweptPrismPair,translatePrism} from '../swept-volume.js';
import {locateFirstModeledPenetration} from '../machine-first-penetration-r134.js';
import {EXAMPLE} from '../engine.js';
import {V85_FACTORY} from '../machine-config.js';
import {technicalScene} from '../technical-section.js';
import {motionPieceKey} from '../machine-axis-motion.js';
import {machineConfigurationKey} from '../machine-cad.js';
import {scanAxisCADMovement} from '../machine-axis-geometry.js';
import {scanVolumeTrajectory} from '../volume-trajectory-review.js';

const prism=(name,x,y,zmin=-10,zmax=10)=>makePrism(name,
 [{x,y},{x:x+2,y},{x:x+2,y:y+2},{x,y:y+2}],zmin,zmax,
 'perfil CAD importado DXF_ASCII_MM · prueba sintética NO OEM');

test('R134: penetración oculta ENTRE dos poses se acota sin muestreo superficial',()=>{
 const a=prism('movil',-12,0),b=translatePrism(a,30,0,0);
 const bed=prism('objetivo',0,0);
 assert.equal(sweptPrismPair(a,b,bed,bed).intersects,true);
 const result=locateFirstModeledPenetration(a,b,bed,bed,2,7);
 assert.equal(result.status,'VENTANA_MODELADA_ACOTADA');
 assert.ok(result.windowSeconds[0]<=2+5/3&&
  result.windowSeconds[1]>=2+5/3,JSON.stringify(result));
 assert.ok(result.widthSeconds<=.02+1e-7);
 assert.ok(result.iterations>0&&result.iterations<=8);
 assert.equal(result.firstPhysicalContactVerified,false);
 assert.equal(result.canApproveForMachine,false);
});
test('R134: si ya hay penetración en la primera pose no inventa un instante anterior',()=>{
 const a=prism('A',0,0),b=prism('B',1,0);
 const r=locateFirstModeledPenetration(a,a,b,b,12,15);
 assert.equal(r.status,'PENETRACION_PRESENTE_AL_INICIO');
 assert.deepEqual(r.windowSeconds,[12,12]);
 assert.equal(r.iterations,0);
 assert.match(r.detail,/inicio anterior desconocido/);
});
test('R134: dos cuerpos móviles se localizan en coordenadas relativas',()=>{
 const a=prism('movil',-12,0),b=translatePrism(a,30,0,0);
 const c=prism('tope',0,0),d=translatePrism(c,5,0,0);
 const r=locateFirstModeledPenetration(a,b,c,d,5,15,
  {maxSteps:12,targetWindowSeconds:.005});
 // Separación inicial: 10 mm; velocidad relativa: 25 mm / 10 s.
 const expect=5+10*10/25;
 assert.equal(r.status,'VENTANA_MODELADA_ACOTADA');
 assert.ok(r.windowSeconds[0]<=expect&&r.windowSeconds[1]>=expect,
  JSON.stringify(r));
 assert.ok(r.widthSeconds<=.005);
});
test('R134: movimiento Z de dedo real también da ventana y no posición inventada',()=>{
 const a=prism('Z1',0,0,-20,-10),b=translatePrism(a,0,0,30);
 const c=prism('Z2',0,0,-5,5);
 const r=locateFirstModeledPenetration(a,b,c,c,0,6);
 assert.equal(r.status,'VENTANA_MODELADA_ACOTADA',r.detail);
 assert.ok(r.windowSeconds[0]<=1&&r.windowSeconds[1]>=1,
  JSON.stringify(r));
 assert.ok(r.widthSeconds<=.02);
});
test('R134: perfil girado, sin CAD, tiempo inválido y ausencia de cruce no producen hora falsa',()=>{
 const a=prism('A',-12,0),b=translatePrism(a,-2,0,0),c=prism('B',0,0);
 assert.equal(locateFirstModeledPenetration(a,b,c,c,0,5).status,
  'SIN_PENETRACION_MODELADA');
 assert.equal(locateFirstModeledPenetration(a,b,c,c,5,5).status,
  'TIEMPOS_NO_VALIDOS');
 const invalid={id:'sin-CAD',valid:false};
 assert.equal(locateFirstModeledPenetration(invalid,b,c,c,0,5).status,
  'GEOMETRIA_NO_RIGIDA');
 const wrong=makePrism('A',[
  {x:-12,y:0},{x:-10,y:0},{x:-9,y:4},{x:-12,y:2}],-10,10,'deformado');
 assert.equal(locateFirstModeledPenetration(a,wrong,c,c,0,5).status,
  'GEOMETRIA_NO_RIGIDA');
});
const machine=V85_FACTORY,machineConfigKeyValue=machineConfigurationKey(machine);
const axes={Y1:0,Y2:0,X:10,R:10,Z1:0,Z2:0};
const ranges=Object.fromEntries(['Y1','Y2','X','R','Z1','Z2']
 .map(v=>[v,{min:-3000,max:3000,maxSpeed:800}]));
const motion={unit:'mm',timeUnit:'s',source:'recorded',
 sourceDescription:'Traza de prueba sintética no CNC de unidad real',
 machineId:'V85',pieceKey:motionPieceKey(EXAMPLE),limits:ranges,
 poses:[{time:0,sceneTime:0,axes},
  {time:5,sceneTime:0,axes:{...axes,Y1:200,Y2:200}}]};
const mapping={unit:'mm',version:1,
 signs:{Y:-1,X:1,R:1,Z1:1,Z2:1},activeFinger:'Z1',
 referenceSceneTime:0,ramTiltTolerance:0,
 source:'Calibración sintética no OEM',
 machineConfigKey:machineConfigKeyValue};
const machineCAD=()=>{
 const tip=technicalScene(EXAMPLE,0).kinematics.tipHeight;
 const cad=(kind,x,y)=>({
  kind,source:'DXF sintético ensayo R134 NO OEM',
  points:[[-10,0],[10,0],[10,10],[-10,10]],
  offsetX:x,offsetY:y,zMin:-15,zMax:15,
  machineConfigKey:machineConfigKeyValue
 });
 return {ram:cad('ram',0,100-tip),bed:cad('bed',0,0),
  stop:cad('stop',150,0)};
};
test('R134: traza CAD de trancha produce intervalos y mantiene evidencia sin certificar',()=>{
 const report=scanAxisCADMovement(EXAMPLE,{
  machine,machineCAD:machineCAD(),mapping,axisMotion:motion});
 const ev=report.events.find(e=>e.moving==='ram'&&e.against==='bed');
 assert.ok(ev,'El barrido RAM contra BED debe mantenerse');
 assert.equal(report.checked,true);
 assert.ok(Array.isArray(ev.impactWindowSeconds),ev.impactWindowStatus);
 assert.ok(ev.impactWindowSeconds[0]>=ev.startTime);
 assert.ok(ev.impactWindowSeconds[1]<=ev.endTime);
 assert.ok(ev.impactWindowResolutionSeconds<=.02);
 assert.equal(ev.firstPhysicalContactVerified,false);
 assert.equal(ev.physicalCollisionCertified,false);
 assert.ok(report.impactWindowsComputed>=1);
 assert.equal(report.firstPhysicalContactVerified,false);
 assert.equal(report.coverage.impactWindowsComputed,report.impactWindowsComputed);
 assert.equal(report.canApproveForMachine,false);
});
test('R134: presupuesto cero NO oculta choques; cada evento queda sin localización',()=>{
 const report=scanAxisCADMovement(EXAMPLE,{
  machine,machineCAD:machineCAD(),mapping,axisMotion:motion,
  maxTimedEvents:0});
 assert.ok(report.events.length>0);
 assert.equal(report.impactWindowsComputed,0);
 assert.equal(report.impactWindowsPending,report.events.length);
 assert.equal(report.impactWindowsUnresolved,0);
 assert.ok(report.events.every(e=>e.impactWindowSeconds===null&&
  e.impactWindowStatus==='PENDIENTE_PRESUPUESTO'));
 assert.equal(report.canApproveForMachine,false);
});
test('R134: informe global integra tiempos CAD y sigue sin autorizar CNC',()=>{
 const scan=scanVolumeTrajectory(EXAMPLE,{machine,machineCAD:machineCAD(),
  axisMotion:motion,axisMapping:mapping,samplesPerOperation:4});
 assert.ok(scan.axisGeometry.events.some(e=>Array.isArray(e.impactWindowSeconds)));
 assert.equal(scan.axisGeometry.firstPhysicalContactVerified,false);
 assert.equal(scan.canApproveForMachine,false);
});
test('R134: el visor y PWA exponen refinamiento sin confundirlo con una hora física',()=>{
 const ui=readFileSync(new URL('../machine-cad-ui.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(ui,/primera penetración MODELADA acotada/);
 assert.match(ui,/impactWindowSeconds/);
 assert.match(sw,/"\.\/machine-first-penetration-r134\.js"/);
 assert.ok(html.includes('id="machineAxisReportDownload"'));
});
