import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePrism} from '../volume-engine.js';
import {translatePrism,sweptPrismPair} from '../swept-volume.js';
import {classifySweptContactEvolution,summarizeContactEvolution}
 from '../machine-contact-evolution-r135.js';
import {EXAMPLE} from '../engine.js';
import {V85_FACTORY} from '../machine-config.js';
import {technicalScene} from '../technical-section.js';
import {machineConfigurationKey} from '../machine-cad.js';
import {motionPieceKey} from '../machine-axis-motion.js';
import {scanAxisCADMovement} from '../machine-axis-geometry.js';
const square=(name,x,y=0,z=-15,zTop=15)=>
 makePrism(name,[{x,y},{x:x+10,y},{x:x+10,y:y+10},{x,y:y+10}],
 z,zTop,'perfil CAD importado DXF_ASCII_MM · ensayo NO OEM');

test('R135: ningún movimiento relativo con penetración inicial es SOLAPE PREEXISTENTE, no choque nuevo',()=>{
 const a=square('ram',0),bed=square('bed',5);
 const result=classifySweptContactEvolution(a,a,bed,bed);
 assert.equal(result.code,'PREEXISTENTE_SIN_MOVIMIENTO_RELATIVO');
 assert.equal(result.createdDuringThisInterval,false);
 assert.equal(result.baselineAlreadyPresent,true);
 assert.equal(result.relativeTranslationMm,0);
 assert.ok(result.initialOverlapMm3>0);
 assert.equal(result.initialOverlapMm3,result.finalOverlapMm3);
 assert.equal(result.physicalCollisionCertified,false);
});
test('R135: contacto inicial que se libera mantiene advertencia de daño previo',()=>{
 const ram=square('ram',0),bed=square('bed',5);
 const final=translatePrism(ram,-30,0);
 const result=classifySweptContactEvolution(ram,final,bed,bed);
 assert.equal(result.code,'PREEXISTENTE_RESUELTA_AL_FINAL');
 assert.equal(result.penetratesInitially,true);
 assert.equal(result.penetratesFinally,false);
 assert.equal(result.createdDuringThisInterval,false);
 assert.equal(result.baselineAlreadyPresent,true);
});
test('R135: penetración inicial y final sigue siendo preexistente aunque haya movimiento',()=>{
 const ram=square('ram',0),bed=square('bed',5);
 const result=classifySweptContactEvolution(ram,translatePrism(ram,2,0),
  bed,bed);
 assert.equal(result.code,'PREEXISTENTE_EN_EXTREMOS');
 assert.equal(result.penetratesInitially,true);
 assert.equal(result.penetratesFinally,true);
 assert.equal(result.createdDuringThisInterval,false);
});
test('R135: separación inicial y penetración final es choque NUEVO del modelo',()=>{
 const ram=square('ram',-30),bed=square('bed',5);
 const result=classifySweptContactEvolution(ram,translatePrism(ram,35,0),
  bed,bed);
 assert.equal(result.code,'NUEVA_AL_FINAL');
 assert.equal(result.penetratesInitially,false);
 assert.equal(result.penetratesFinally,true);
 assert.equal(result.createdDuringThisInterval,true);
 assert.equal(result.baselineAlreadyPresent,false);
});
test('R135: dos extremos libres con colisión intermedia exige barrido continuo',()=>{
 const ram=square('ram',-30),bed=square('bed',5);
 const finish=translatePrism(ram,60,0);
 assert.equal(sweptPrismPair(ram,finish,bed,bed).intersects,true);
 const result=classifySweptContactEvolution(ram,finish,bed,bed);
 assert.equal(result.code,'TRANSITORIA_ENTRE_POSES');
 assert.equal(result.createdDuringThisInterval,true);
 assert.equal(result.penetratesInitially,false);
 assert.equal(result.penetratesFinally,false);
});
test('R135: transformaciones relativas nulas también se detectan con cuerpos que se mueven juntos',()=>{
 const a=square('a',0),b=square('b',5);
 const p=classifySweptContactEvolution(a,translatePrism(a,40,10,30),
  b,translatePrism(b,40,10,30));
 assert.equal(p.code,'PREEXISTENTE_SIN_MOVIMIENTO_RELATIVO');
 assert.equal(p.relativeTranslationMm,0);
});
test('R135: geometría inválida no se etiqueta como NUEVA ni libre',()=>{
 const a=square('a',0),b=square('b',5);
 const wrong={valid:false};
 const result=classifySweptContactEvolution(wrong,a,b,b);
 assert.equal(result.code,'GEOMETRIA_INDETERMINADA');
 assert.equal(result.createdDuringThisInterval,false);
 assert.equal(result.certified,false);
});
test('R135: informe separa incidencias nuevas y preexistentes sin conceder semáforo verde',()=>{
 const events=[
  {contactEvolutionCode:'NUEVA_AL_FINAL'},
  {contactEvolutionCode:'TRANSITORIA_ENTRE_POSES'},
  {contactEvolutionCode:'PREEXISTENTE_SIN_MOVIMIENTO_RELATIVO'},
  {contactEvolutionCode:'PREEXISTENTE_RESUELTA_AL_FINAL'},
  {contactEvolutionCode:'GEOMETRIA_INDETERMINADA'}
 ];
 const summary=summarizeContactEvolution(events);
 assert.equal(summary.total,5);
 assert.equal(summary.newDuringInterval,2);
 assert.equal(summary.preexistingAtStart,2);
 assert.equal(summary.preexistingWithoutRelativeMotion,1);
 assert.equal(summary.undetermined,1);
 assert.equal(summary.noNewModeledPenetrations,false);
 assert.equal(summary.physicalCollisionCertified,false);
 const prior=summarizeContactEvolution(events.slice(2,4));
 assert.equal(prior.status,'SOLAPES_PREEXISTENTES_PENDIENTES_DE_COTEJO');
 assert.equal(prior.noNewModeledPenetrations,true);
 assert.equal(prior.physicalCollisionCertified,false);
});
const machine=V85_FACTORY,key=machineConfigurationKey(machine);
const limits=Object.fromEntries(['Y1','Y2','X','R','Z1','Z2']
 .map(axis=>[axis,{min:-3000,max:3000,maxSpeed:800}]));
const axes={Y1:0,Y2:0,X:10,R:10,Z1:0,Z2:0};
const mapping={unit:'mm',version:1,
 signs:{Y:-1,X:1,R:1,Z1:1,Z2:1},
 activeFinger:'Z1',referenceSceneTime:0,ramTiltTolerance:0,
 machineConfigKey:key,source:'Datum sintético no CNC OEM'};
const motion=(Y=200)=>({unit:'mm',timeUnit:'s',source:'programmed',
 sourceDescription:'Ensayo sintético sin movimientos de CNC real',
 machineId:'V85',pieceKey:motionPieceKey(EXAMPLE),limits,
 poses:[{time:0,sceneTime:0,axes},
 {time:5,sceneTime:0,axes:{...axes,Y1:Y,Y2:Y}}]});
const cad=(kind,x,y)=>({
 kind,source:'CAD de ensayo R135 NO OEM',machineConfigKey:key,
 points:[[-10,0],[10,0],[10,10],[-10,10]],
 offsetX:x,offsetY:y,zMin:-15,zMax:15
});
test('R135: motor CAD/CNC conserva choque NUEVO de trancha y evidencia PREEXISTENTE separada',()=>{
 const tip=technicalScene(EXAMPLE,0).kinematics.tipHeight;
 const fixture={
  ram:cad('ram',0,100-tip),bed:cad('bed',0,0),
  upperAdapter:cad('upperAdapter',0,-tip),stop:cad('stop',150,0)
 };
 const report=scanAxisCADMovement(EXAMPLE,{machine,machineCAD:fixture,
  mapping,axisMotion:motion()});
 const newContact=report.events.find(e=>e.moving==='ram'&&e.against==='bed');
 assert.ok(newContact,'Falta choque de trancha con mesa');
 assert.equal(newContact.createdDuringThisInterval,true);
 assert.equal(newContact.contactEvolutionCode,'TRANSITORIA_ENTRE_POSES');
 const existing=report.events.find(e=>e.moving==='upperAdapter'&&e.against==='bed');
 assert.ok(existing,'Solape previo adaptador/mesa debe seguir presente');
 assert.equal(existing.contactEvolutionCode,'PREEXISTENTE_RESUELTA_AL_FINAL');
 assert.equal(existing.createdDuringThisInterval,false);
 assert.equal(existing.preexistingAtStart,true);
 assert.ok(report.contactEvolutionSummary.newDuringInterval>0);
 assert.ok(report.contactEvolutionSummary.preexistingAtStart>0);
 assert.equal(report.contactEvolutionSummary.physicalCollisionCertified,false);
 assert.equal(report.coverage.contactEvolution.newDuringInterval,
  report.contactEvolutionSummary.newDuringInterval);
 assert.equal(report.canApproveForMachine,false);
});
test('R135: rango sin carrera muestra solape previo, no inventa choque durante movimiento',()=>{
 const tip=technicalScene(EXAMPLE,0).kinematics.tipHeight;
 const fixture={
  ram:cad('ram',0,-tip),bed:cad('bed',0,0),stop:cad('stop',150,0)
 };
 const report=scanAxisCADMovement(EXAMPLE,{machine,machineCAD:fixture,
  mapping,axisMotion:motion(0)});
 const existing=report.events.find(e=>e.moving==='ram'&&e.against==='bed');
 assert.ok(existing);
 assert.equal(existing.contactEvolutionCode,'PREEXISTENTE_SIN_MOVIMIENTO_RELATIVO');
 assert.equal(existing.impactWindowStatus,'PENETRACION_PRESENTE_AL_INICIO');
 assert.equal(existing.firstPhysicalContactVerified,false);
 assert.equal(report.canApproveForMachine,false);
});
test('R135: UI filtra sin recalcular y PWA almacena módulo nuevo sin certificar',()=>{
 const ui=readFileSync(new URL('../machine-cad-ui.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const id of ['machineAxisEvolutionFilter','machineAxisEvolutionSummary'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(ui,/lastAxisReview/);
 assert.match(ui,/PREEXISTENTE|preexistingAtStart/);
 assert.match(ui,/renderAxisFindings/);
 assert.ok(sw.includes('"./machine-contact-evolution-r135.js"'));
});
