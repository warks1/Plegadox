import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXAMPLE,normalized} from '../engine.js';
import {motionPieceKey} from '../machine-axis-motion.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {machineConfigurationKey,normalizeMachineCad} from '../machine-cad.js';
import {getActiveMachineProfile} from '../machine-selection.js';
import {gaugeSectionFingerprint} from '../machine-gauge-fingers.js';
import {scanAxisCADMovement} from '../machine-axis-geometry.js';
import {classifyAxisContact,summarizeAxisContacts} from '../machine-axis-evidence.js';
import {scanVolumeTrajectory} from '../volume-trajectory-review.js';

const machine=getActiveMachineConfig(),machineKey=machineConfigurationKey(machine);
const motionAxes={Y1:0,Y2:0,X:0,R:0,Z1:0,Z2:0};
const limits=Object.fromEntries(['Y1','Y2','X','R','Z1','Z2']
 .map(axis=>[axis,{min:-1000,max:1000,maxSpeed:null}]));
const mapping=()=>({version:1,unit:'mm',
 signs:{Y:1,X:1,R:1,Z1:1,Z2:1},activeFinger:'Z1',
 referenceSceneTime:0,ramTiltTolerance:0,
 source:'Datum CNC de prueba sintético, no OEM',
 machineConfigKey:machineKey});
const motion=(piece=EXAMPLE,overrides={})=>({
 unit:'mm',timeUnit:'s',source:'programmed',
 sourceDescription:'Trayectoria de ensayo NO derivada de la CNC real',
 machineId:getActiveMachineProfile().id,pieceKey:motionPieceKey(piece),
 limits,poses:[
  {time:0,sceneTime:0,axes:{...motionAxes}},
  {time:1,sceneTime:0,axes:{...motionAxes,Z1:22,Z2:-22}}
 ],...overrides
});
const cad=(kind,offsetX=0)=>normalizeMachineCad({
 kind,points:[[0,0],[16,0],[16,20],[0,20]],
 offsetX,offsetY:0,zMin:-40,zMax:40,
 source:'Perfil geométrico de ensayo '+kind+' NO OEM',machineConfigKey:machineKey});
const independent=()=>{
 const a=cad('stopZ1'),b=cad('stopZ2');
 return {machineCAD:{stopZ1:a,stopZ2:b},
  gaugeFingers:{version:1,unit:'mm',machineConfigKey:machineKey,
   profileKind:'stop',sameSectionConfirmed:false,
   profileFingerprints:{Z1:gaugeSectionFingerprint(a),Z2:gaugeSectionFingerprint(b)},
   source:'Cota de prueba transversal sin certificar',
   referenceSceneTime:0,
   fingers:{Z1:{zMin:-20,zMax:-5},Z2:{zMin:5,zMax:20}}}
 };
};

test('R130: cambios de Stop/Support, punto de apoyo, ancho y radios invalidan traza CNC',()=>{
 const original=motionPieceKey(EXAMPLE);
 const variations=[
  {...EXAMPLE,stopByBend:[2,1,1,1]},
  {...EXAMPLE,gaugePointByBend:[20,null,null,null]},
  {...EXAMPLE,gaugeSegmentByBend:[1,null,null,null]},
  {...EXAMPLE,radius:3.3},
  {...EXAMPLE,kFactor:.39},
  {...EXAMPLE,bendDeductionByBend:[2,null,null,null]},
  {...EXAMPLE,punchOrientation:'reversed'}
 ];
 for(const piece of variations)
  assert.notEqual(motionPieceKey(piece),original,
   'Una pieza con apoyo/utillaje/desarrollo cambiado no puede reutilizar CNC');
 assert.equal(motionPieceKey(normalized(EXAMPLE)),original);
});
test('R130: informe rechaza traza de otra pieza y de otra plegadora',()=>{
 const original=motion();
 const another={...EXAMPLE,stopByBend:[2,1,1,1]};
 const stale=scanAxisCADMovement(another,{
  machine,axisMotion:original,mapping:mapping()});
 assert.equal(stale.status,'TRAZA_DE_OTRA_PIEZA');
 assert.equal(stale.checked,false);
 assert.equal(stale.canApproveForMachine,false);
 const otherMachine=scanAxisCADMovement(EXAMPLE,{
  machine,axisMotion:motion(EXAMPLE,{machineId:'bystronic-pr100-3100'}),
  mapping:mapping()});
 assert.equal(otherMachine.status,'TRAZA_DE_OTRA_MAQUINA');
 assert.equal(otherMachine.checked,false);
});
test('R130: clasifica por procedencia CAD sin presentar una colisión OEM certificada',()=>{
 const cadSource='perfil CAD importado DXF_ASCII_MM · test · montaje sin certificar';
 const sheet='malla-chapa-compartida';
 assert.deepEqual(classifyAxisContact(cadSource,cadSource).code,'DOS_PERFILES_CAD');
 assert.equal(classifyAxisContact(cadSource,sheet).code,'CAD_Y_MODELO');
 assert.equal(classifyAxisContact('envolvente-ilustrativa-sin-CAD',sheet).code,
  'GEOMETRIA_PROVISIONAL');
 assert.equal(classifyAxisContact(cadSource,sheet).physicalCollisionCertified,false);
 const summary=summarizeAxisContacts([
  {evidenceCode:'DOS_PERFILES_CAD'},
  {evidenceCode:'CAD_Y_MODELO'},
  {evidenceCode:'GEOMETRIA_PROVISIONAL'},
  {evidenceCode:'DESCONOCIDO'}
 ]);
 assert.equal(summary.cadPairCount,1);
 assert.equal(summary.mixedCount,1);
 assert.equal(summary.provisionalCount,1);
 assert.equal(summary.physicalCollisionCertified,false);
 assert.equal(summary.status,'SOLAPE_ENTRE_DXF_DECLARADOS');
});
test('R130: dos dedos DXF reales no generan carencia ficticia del perfil Stop común',()=>{
 const options=independent();
 const scan=scanAxisCADMovement(EXAMPLE,{
  machine,machineId:getActiveMachineProfile().id,
  axisMotion:motion(),mapping:mapping(),...options
 });
 assert.equal(scan.bothGaugeFingersModeled,true,scan.status);
 assert.deepEqual(scan.gaugeCadKindsRequired,['stopZ1','stopZ2']);
 assert.equal(scan.missingCad.includes('stop'),false);
 assert.equal(scan.missingCad.includes('stopZ1'),false);
 assert.equal(scan.missingCad.includes('stopZ2'),false);
 assert.equal(scan.coverage.machineCadRequired,9);
 assert.equal(scan.coverage.machineCadPresent>=2,true);
 assert.ok(scan.events.some(ev=>ev.moving==='gaugeZ1'&&ev.against==='gaugeZ2'));
 const crossing=scan.events.find(ev=>ev.moving==='gaugeZ1'&&ev.against==='gaugeZ2');
 assert.equal(crossing.evidenceCode,'DOS_PERFILES_CAD');
 assert.equal(crossing.physicalCollisionCertified,false);
 assert.equal(scan.evidenceSummary.cadPairCount>=1,true);
 assert.equal(scan.status,'SOLAPE_ENTRE_DXF_DECLARADOS');
 assert.equal(scan.canApproveForMachine,false);
 assert.equal(scan.traceSource,'programmed');
 assert.equal(scan.verified,false);
 assert.equal(scan.events.every(e=>e.verified===false),true);
});
test('R130: barrido paramétrico también informa sin fingir CAD físico',()=>{
 const scan=scanAxisCADMovement(EXAMPLE,{
  machine,machineId:getActiveMachineProfile().id,
  axisMotion:motion(),mapping:mapping(),machineCAD:{}
 });
 assert.equal(scan.bothGaugeFingersModeled,false);
 assert.ok(scan.missingCad.includes('stop'));
 assert.equal(scan.evidenceSummary.cadPairCount,0);
 assert.equal(scan.evidenceSummary.physicalCollisionCertified,false);
 assert.equal(scan.canApproveForMachine,false);
});
test('R130: el informe de volumen incorpora evidencias del eje y preserva falta de certificación',()=>{
 const scan=scanVolumeTrajectory(EXAMPLE,{
  machine,machineId:getActiveMachineProfile().id,
  axisMotion:motion(),axisMapping:mapping(),
  ...independent(),samplesPerOperation:4,axisGeometryMaxIntervals:8
 });
 assert.equal(scan.axisGeometry.bothGaugeFingersModeled,true);
 assert.equal(scan.axisGeometry.missingCad.includes('stop'),false);
 assert.ok(scan.axisEvidenceSummary);
 assert.equal(scan.axisEvidenceSummary.cadPairCount>=1,true);
 assert.equal(scan.canApproveForMachine,false);
});
test('R130: panel y PWA contienen diagnóstico, exportación y módulo de evidencias',()=>{
 const ui=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../machine-cad-ui.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const id of ['machineAxisEvidencePanel','machineAxisFindings',
  'machineAxisReportDownload'])
  assert.ok(ui.includes('id="'+id+'"'));
 assert.match(js,/evidenceSummary/);
 assert.match(js,/contacto-cad-trayectoria|evidenceLabel/);
 assert.ok(sw.includes('"./machine-axis-evidence.js"'));
});
