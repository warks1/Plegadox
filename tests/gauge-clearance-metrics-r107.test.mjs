import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectGaugeProfile} from '../gauge-interference.js';
import {gaugeRiskStatus} from '../gauge-risk-status.js';
import {gaugeStatusCardLayout} from '../machine-visual.js';
import {planGaugeRetraction} from '../gauge-retract-motion.js';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';
import {buildGaugeMotionDiagnostic} from '../gauge-motion-diagnostic.js';

const rectangle=[{x:10,y:-5},{x:40,y:-5},{x:40,y:5},{x:10,y:5}];
const contact={x:10,y:0};
const base={phase:'Plegado',freeEdge:true,sheetEdgeFound:true,sheetInFront:true,
 seat:{seated:true},contact:{usable:true},setupValid:true,
 gaugeDecision:{known:true,enabled:false}};

test('R107: holgura reporta mm reales, mitad del espesor y déficit',()=>{
 const hit=inspectGaugeProfile([{x:0,y:6},{x:25,y:6}],
  rectangle,4,contact);
 assert.equal(hit.kind,'holgura');
 assert.equal(hit.warning,true);
 assert.equal(hit.distanceMm,1);
 assert.equal(hit.requiredMm,2);
 assert.equal(hit.deficitMm,1);
 assert.deepEqual(hit.closestFingerPoint,{x:25,y:5});
 assert.equal(hit.fingerEdge,2);
 assert.equal(hit.segment,0);
 const risk=gaugeRiskStatus({...base,gaugeInterference:hit});
 assert.equal(risk.level,'amber');
 assert.equal(risk.code,'holgura-actual');
 assert.equal(risk.clearanceMm,1);
 assert.equal(risk.requiredMm,2);
 assert.ok(risk.message.includes('1.00 mm'));
 const layout=gaugeStatusCardLayout(460,320,220,120,1,
  risk.level,1,null,null,risk.code,risk.clearanceMm,risk.requiredMm);
 assert.ok(layout.subline.includes('HOLGURA 1.00 / MÍN 2.00 mm'));
});

test('R107: seleccionar la holgura más estrecha, no la primera arista encontrada',()=>{
 const sheet=[{x:0,y:6},{x:25,y:6},{x:50,y:5.4}];
 const hit=inspectGaugeProfile(sheet,rectangle,4,contact);
 assert.equal(hit.kind,'holgura');
 assert.ok(Math.abs(hit.distanceMm-.4)<1e-7,
  'Debe encontrar la proximidad de 0,4 mm sobre el segundo tramo');
 assert.ok(Math.abs(hit.deficitMm-1.6)<1e-7);
 assert.equal(hit.segment,1);
});

test('R107: penetración posterior tiene prioridad incluso con holgura medida',()=>{
 const sheet=[{x:0,y:6},{x:25,y:6},{x:25,y:0}];
 const hit=inspectGaugeProfile(sheet,rectangle,4,contact);
 assert.equal(hit.kind,'penetracion');
 assert.equal(gaugeRiskStatus({...base,gaugeInterference:hit}).level,'red');
 assert.equal(hit.distanceMm,undefined,'No inventar profundidad de penetración');
});

test('R107: contacto nominal limpio no crea una distancia de riesgo ficticia',()=>{
 const hit=inspectGaugeProfile([{x:0,y:0},{x:10,y:0}],rectangle,2,contact);
 assert.equal(hit.kind,'sin-interferencia-detectada');
 assert.equal(hit.warning,false);
 assert.equal(hit.distanceMm,undefined);
 assert.equal(gaugeRiskStatus({...base,gaugeInterference:hit}).level,'green');
});

test('R107: holgura no se convierte automáticamente en orden de retroceso CNC',()=>{
 const sheetSamples=[{at:.44,sheet:[{x:0,y:6},{x:25,y:6}]}];
 const result=planGaugeRetraction({sheetSamples,polygon:rectangle,
  thickness:4,contact});
 assert.equal(result.known,true);
 assert.equal(result.enabled,false);
 assert.equal(result.penetrationCount,0);
 assert.equal(result.clearanceWarnings,1);
 assert.equal(result.issues[0].distanceMm,1);
 assert.equal(result.issues[0].requiredMm,2);
 assert.equal(result.verified,false);
});

test('R107: Omega conserva mismas mediciones en visor y diagnóstico JSON',()=>{
 const piece=normalized(EXAMPLE),samples=[.46,.48,.50];
 const report=buildGaugeMotionDiagnostic(piece,{build:'QA-R107',samples});
 assert.deepEqual(report.operationOrder,[1,2,4,3]);
 for(let op=0;op<4;op++)for(let i=0;i<samples.length;i++){
  const scene=technicalScene(piece,5*(op+samples[i]));
  const stop=piece.stopByBend[scene.stage.activeBend];
  const placement=gaugePlacement(scene,stop);
  const hit=placement.gaugeInterference;
  const frame=report.operations[op].frames[i];
  assert.equal(frame.actualInterference.kind,hit?.kind);
  assert.equal(frame.actualInterference.distanceMm,hit?.distanceMm??null);
  assert.equal(frame.actualInterference.requiredMm,hit?.requiredMm??null);
  assert.equal(frame.actualInterference.deficitMm,hit?.deficitMm??null);
  assert.equal(frame.actualInterference.fingerEdge,hit?.fingerEdge??null);
  assert.equal(frame.risk.level,gaugeRiskStatus(placement).level);
  if(hit?.kind==='holgura'){
   assert.ok(Number.isFinite(hit.distanceMm));
   assert.ok(hit.requiredMm>hit.distanceMm);
   assert.equal(frame.risk.code,'holgura-actual');
  }
 }
 assert.equal(report.canApproveForMachine,false);
});
