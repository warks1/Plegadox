import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyCncGaugeSemaphore,boundCncGaugeStatus}
 from '../machine-cnc-gauge-semaphore-r136.js';
import {EXAMPLE} from '../engine.js';
import {V85_FACTORY} from '../machine-config.js';
import {machineConfigurationKey} from '../machine-cad.js';
import {motionPieceKey} from '../machine-axis-motion.js';
import {scanAxisCADMovement} from '../machine-axis-geometry.js';
import {buildVolumeScene} from '../volume-engine.js';
import {technicalScene} from '../technical-section.js';

const clean=()=>({
 checked:true,intervalsChecked:2,events:[],
 missingCad:[],uniquePendingPairs:0,pairIntervalsMissing:0,
 unresolved:0,suppressedEvents:0,ramTiltApproximatedIntervals:0,
 impactWindowsUnresolved:0,canApproveForMachine:false
});
const collision=(moving,against,code,evolution='NUEVA_AL_FINAL')=>({
 moving,against,evidenceCode:code,
 contactEvolutionCode:evolution,
 createdDuringThisInterval:['NUEVA_AL_FINAL','TRANSITORIA_ENTRE_POSES']
  .includes(evolution),
 preexistingAtStart:evolution.startsWith('PREEXISTENTE_'),
 physicalCollisionCertified:false
});
test('R136: sin traza es neutro, NO naranja por supuesta colisión',()=>{
 for(const report of [null,{status:'EJES_SIN_DATUM_CAD',checked:false},
  {checked:true,intervalsChecked:0,events:[]}]){
  const result=classifyCncGaugeSemaphore(report);
  assert.equal(result.level,'neutral');
  assert.equal(result.code,'SIN_TRAZA_CNC_APLICABLE');
  assert.equal(result.canApproveForMachine,false);
 }
});
test('R136: nueva penetración CAD-CAD del dedo Z1 en modelo da rojo, NO choque inevitable',()=>{
 const report=clean();
 report.events.push(collision('gaugeZ1','bed','DOS_PERFILES_CAD'));
 const result=classifyCncGaugeSemaphore(report);
 assert.equal(result.level,'red');
 assert.equal(result.code,'TOPE_PENETRACION_NUEVA_CAD');
 assert.equal(result.newEvents,1);
 assert.match(result.reason,/NO implica colisión real inevitable/);
 assert.equal(result.physicalCollisionCertified,false);
});
test('R136: dos perfiles CAD, choque transitorio Z1/Z2, sigue siendo rojo modelado',()=>{
 const report=clean();
 report.events.push(collision('gaugeZ1','gaugeZ2','DOS_PERFILES_CAD',
  'TRANSITORIA_ENTRE_POSES'));
 assert.equal(classifyCncGaugeSemaphore(report).level,'red');
});
test('R136: penetración nueva con perfil provisional no finge rojo CAD-CAD',()=>{
 const report=clean();
 report.events.push(collision('gauge','punch','GEOMETRIA_PROVISIONAL'));
 const result=classifyCncGaugeSemaphore(report);
 assert.equal(result.level,'amber');
 assert.equal(result.code,'TOPE_PENETRACION_NUEVA_PROVISIONAL');
});
test('R136: la media de Y1/Y2 con desviación no produce falso rojo',()=>{
 const report=clean();
 report.events.push({...collision('gaugeZ2','upperClamp','DOS_PERFILES_CAD'),
  upperAssemblyTiltUnmodeled:true});
 assert.equal(classifyCncGaugeSemaphore(report).level,'amber');
});
test('R136: solape preexistente del tope es naranja, no colisión nueva',()=>{
 const report=clean();
 report.events.push(collision('gauge','die','DOS_PERFILES_CAD',
  'PREEXISTENTE_SIN_MOVIMIENTO_RELATIVO'));
 const result=classifyCncGaugeSemaphore(report);
 assert.equal(result.level,'amber');
 assert.equal(result.newEvents,0);
 assert.equal(result.preexistingEvents,1);
 assert.match(result.reason,/no son choques NUEVOS/);
});
test('R136: solape previo + choque nuevo no oculta el riesgo de la carrera',()=>{
 const report=clean();
 report.events.push(collision('gauge','die','DOS_PERFILES_CAD',
  'PREEXISTENTE_EN_EXTREMOS'));
 report.events.push(collision('ram','gauge','DOS_PERFILES_CAD',
  'TRANSITORIA_ENTRE_POSES'));
 const result=classifyCncGaugeSemaphore(report);
 assert.equal(result.level,'red');
 assert.equal(result.newEvents,1);
 assert.equal(result.preexistingEvents,1);
});
test('R136: colisión de trancha sin participación del tope NO pinta el dedo rojo',()=>{
 const report=clean();
 report.events.push(collision('ram','bed','DOS_PERFILES_CAD'));
 const result=classifyCncGaugeSemaphore(report);
 assert.equal(result.level,'green');
 assert.equal(result.gaugeEvents,0);
 assert.match(result.headline,/SIN PENETRACIÓN MODELADA/);
 assert.equal(result.canApproveForMachine,false);
});
test('R136: faltan CAD de dedo o parejas => neutro sin falso naranja ni verde',()=>{
 for(const modification of [
  {missingCad:['stop']},
  {missingCad:['supportZ2']},
  {uniquePendingPairs:5},
  {pairIntervalsMissing:5},
  {unresolved:1},
  {suppressedEvents:2},
  {ramTiltApproximatedIntervals:1},
  {impactWindowsUnresolved:1}
 ]){
  const result=classifyCncGaugeSemaphore({...clean(),...modification});
  assert.equal(result.level,'neutral',JSON.stringify(modification));
  assert.equal(result.code,'TOPE_CNC_INCOMPLETO');
  assert.equal(result.physicalCollisionCertified,false);
 }
});
test('R136: código neutro nunca confunde ausencia de DXF con colisión en Galaxy',()=>{
 const report=scanAxisCADMovement(EXAMPLE,{machine:V85_FACTORY});
 const result=classifyCncGaugeSemaphore(report);
 assert.equal(result.level,'neutral');
 assert.equal(result.newEvents,0);
});
test('R136: snapshot de otra pieza/máquina/CAD/fase no se atribuye al fotograma 3D',()=>{
 const context={pieceKey:'pieza-ok',machineId:'trumpf-v85',
  machineConfigKey:'v85-abc12345',sceneTime:0};
 const report=classifyCncGaugeSemaphore({...clean(),
  events:[collision('gauge','bed','DOS_PERFILES_CAD')]});
 const snapshot={...context,referenceSceneTime:0,status:report};
 assert.equal(boundCncGaugeStatus(snapshot,context).level,'red');
 for(const update of [
  {pieceKey:'pieza-otra'},{machineId:'bystronic-2006-100-3100'},
  {machineConfigKey:'v85-deadbeef'},{sceneTime:2}
 ]){
  const result=boundCncGaugeStatus(snapshot,{...context,...update});
  assert.equal(result.level,'neutral',JSON.stringify(update));
  assert.equal(result.canApproveForMachine,false);
 }
 assert.equal(boundCncGaugeStatus(snapshot,{...context,sceneTime:2}).code,
  'OTRA_FASE_DE_CHAPA');
 assert.equal(boundCncGaugeStatus(null,context).code,'INFORME_DESACTUALIZADO');
});
test('R136: barrido CNC de dedo con DOS CAD sintéticos detecta penetración nueva sin confundirla con una alerta 2D',()=>{
 const machine=V85_FACTORY,key=machineConfigurationKey(machine);
 const stop={kind:'stop',machineConfigKey:key,
  source:'Contorno de prueba DXF NO OEM',points:[
   [-5,-5],[5,-5],[5,5],[-5,5]],
  offsetX:0,offsetY:0,zMin:-15,zMax:15};
 const base=buildVolumeScene(technicalScene(EXAMPLE,0),{
  machine,machineCAD:{stop}
 });
 const gauge=base.objects.gauge;
 assert.ok(gauge.valid&&gauge.provenance.startsWith('perfil CAD importado '));
 const middleX=(Math.min(...gauge.polygon.map(p=>p.x))+
  Math.max(...gauge.polygon.map(p=>p.x)))/2;
 const middleY=(Math.min(...gauge.polygon.map(p=>p.y))+
  Math.max(...gauge.polygon.map(p=>p.y)))/2;
 const bed={...stop,kind:'bed',offsetX:middleX-30,offsetY:middleY};
 const axes={Y1:0,Y2:0,X:0,R:0,Z1:0,Z2:0};
 const limits=Object.fromEntries(['Y1','Y2','X','R','Z1','Z2']
  .map(axis=>[axis,{min:-3000,max:3000,maxSpeed:1000}]));
 const motion={unit:'mm',timeUnit:'s',source:'programmed',
  sourceDescription:'Barrido de tope para ensayo R136, NO CNC real',
  machineId:'V85',pieceKey:motionPieceKey(EXAMPLE),limits,
  poses:[{time:0,sceneTime:0,axes},
   {time:5,sceneTime:0,axes:{...axes,X:-60}}]};
 const mapping={unit:'mm',version:1,
  signs:{Y:1,X:1,R:1,Z1:1,Z2:1},
  activeFinger:'Z1',referenceSceneTime:0,
  ramTiltTolerance:0,machineConfigKey:key,
  source:'DATUM ensayado únicamente para prueba de código'};
 const review=scanAxisCADMovement(EXAMPLE,{
  machine,machineCAD:{stop,bed},axisMotion:motion,mapping
 });
 const hit=review.events.find(e=>
  e.moving==='gauge'&&e.against==='bed'&&
  e.createdDuringThisInterval===true);
 assert.ok(hit,'El barrido del dedo a través del bed debe crear penetración del modelo');
 assert.equal(hit.evidenceCode,'DOS_PERFILES_CAD');
 const status=classifyCncGaugeSemaphore(review);
 assert.equal(status.level,'red');
 assert.equal(status.code,'TOPE_PENETRACION_NUEVA_CAD');
 assert.equal(status.canApproveForMachine,false);
});
test('R136: app conserva semáforo 2D independiente y CNC separado con caché Galaxy',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const viewer=readFileSync(new URL('../machine-volume-viewer.js',import.meta.url),'utf8');
 const controller=readFileSync(new URL('../machine-cad-ui.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const style=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
 assert.ok(html.includes('id="machineGaugeEvidence"'));
 assert.ok(html.includes('id="machineCncGaugeEvidence"'));
 assert.ok(html.includes('data-level="neutral"'));
 assert.ok(viewer.includes('boundCncGaugeStatus'));
 assert.ok(viewer.includes('TOPE 2D:'));
 assert.ok(viewer.includes('CNC: SIN EVIDENCIA APLICABLE'));
 assert.ok(controller.includes('PLEGADOX_CNC_GAUGE_SNAPSHOT'));
 assert.ok(controller.includes('plegadox:cncGaugeReview'));
 assert.ok(style.includes('.px-cnc-gauge-status[data-level="neutral"]'));
 assert.ok(sw.includes('"./machine-cnc-gauge-semaphore-r136.js"'));
});
