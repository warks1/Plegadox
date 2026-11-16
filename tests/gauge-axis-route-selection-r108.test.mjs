import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseGaugeAxisOrder,stagedGaugeAxes,gaugeRetractionPath}
 from '../gauge-retract-motion.js';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {scanGaugeSequence,inspectGaugeOperation}
 from '../gauge-sequence-review.js';
import {gaugeRiskStatus} from '../gauge-risk-status.js';
import {buildGaugeMotionDiagnostic} from '../gauge-motion-diagnostic.js';

test('R108: elegir X→R cuando R→X atraviesa un ala de chapa 2D',()=>{
 const plan=chooseGaugeAxisOrder(order=>({
  penetrations:order==='R-then-X'?6:0,
  clearances:order==='R-then-X'?0:2,
  incomplete:0,checkedFrames:61
 }));
 assert.equal(plan.axisOrder,'X-then-R');
 assert.equal(plan.selectedPenetrations,0);
 assert.equal(plan.unresolvedPenetration,false);
 assert.equal(plan.verified,false);
 assert.equal(plan.options.length,2);
});

test('R108: si ambas rutas penetran, avisar en lugar de certificar retorno',()=>{
 const plan=chooseGaugeAxisOrder(order=>({
  penetrations:order==='R-then-X'?4:2,
  clearances:0,checkedFrames:61
 }));
 assert.equal(plan.axisOrder,'X-then-R');
 assert.equal(plan.unresolvedPenetration,true);
 const placement={
  phase:'Posicionamiento',freeEdge:true,sheetEdgeFound:true,
  sheetInFront:true,seat:{seated:true},contact:{usable:true},
  contactEngaged:true,setupValid:true,
  gaugeDecision:{known:true,enabled:false,movementCollisionUnresolved:true},
  gaugeInterference:{kind:'sin-interferencia-detectada',warning:false}
 };
 const risk=gaugeRiskStatus(placement);
 assert.equal(risk.level,'amber');
 assert.equal(risk.code,'ruta-ejes-no-segura-2d');
 assert.equal(risk.verified,false);
 assert.equal(gaugeRiskStatus({...placement,gaugeInterference:{
  kind:'penetracion',warning:true}}).level,'red',
  'La penetración presente tiene prioridad sobre la ruta futura');
});

test('R108: mismo riesgo en ambas rutas mantiene orden preferido sin voltear',()=>{
 const plan=chooseGaugeAxisOrder(()=>({
  penetrations:0,clearances:2,checkedFrames:61
 }));
 assert.equal(plan.axisOrder,'R-then-X');
 assert.equal(plan.unresolvedPenetration,false);
 assert.equal(plan.verified,false);
 assert.throws(()=>chooseGaugeAxisOrder(null),/Evaluador/);
});

test('R108: ruta X→R utiliza dos ejes separados también en giro real',()=>{
 const from={x:50,y:1},to={x:180,y:86};
 const start=stagedGaugeAxes(from,to,.2,{order:'X-then-R'});
 const mid=stagedGaugeAxes(from,to,.42,{order:'X-then-R'});
 const late=stagedGaugeAxes(from,to,.8,{order:'X-then-R'});
 assert.equal(start.axisPhase,'X');
 assert.equal(start.point.y,from.y);
 assert.deepEqual(mid.point,{x:to.x,y:from.y});
 assert.equal(late.axisPhase,'R');
 assert.equal(late.point.x,to.x);
 assert.deepEqual(stagedGaugeAxes(from,to,1,{order:'X-then-R'}).point,to);
 const motion=gaugeRetractionPath({anchor:from,target:to,enabled:false,
  sub:.94,axisOrder:'X-then-R'});
 assert.equal(motion.axisPhase,'R');
 assert.equal(motion.point.x,to.x);
 assert.equal(motion.verified,false);
});

test('R108: Omega 60/85/120/85/60 evita la penetración introducida por R→X',()=>{
 const piece=normalized({...EXAMPLE,
  flanges:[60,85,120,85,60],stopByBend:[2,1,2,1]});
 const original=JSON.stringify(piece);
 // G3 es el pliegue físico 4. G4 es el pliegue físico 3.
 const scene=technicalScene(piece,5*(2+.92));
 const route=scene.gaugePlan.returnRoute;
 assert.ok(route,'Dos ejes diferentes requieren comparar las rutas');
 assert.equal(scene.gaugePlan.axisOrder,'X-then-R');
 const r=route.options.find(q=>q.order==='R-then-X');
 const x=route.options.find(q=>q.order==='X-then-R');
 assert.ok(r.penetrations>0,'Ruta antigua R→X atraviesa la pestaña');
 assert.equal(x.penetrations,0,'Nueva ruta sin penetración 2D en 61 poses');
 assert.equal(scene.gaugePlan.movementCollisionUnresolved,false);
 assert.equal(scene.gaugeTransition.axisPhase,'R',
  'La segunda fase de la ruta elegida ya está cambiando altura');
 const scan=scanGaugeSequence(piece,{samplesPerOperation:24});
 const third=scan.operations[2];
 assert.ok(!third.findings.some(f=>f.kind==='penetracion'&&f.movingFinger),
  'No introducir una colisión 2D durante G3→G4');
 assert.equal(third.movementWarnings,0);
 assert.deepEqual(piece.order,[0,1,3,2]);
 assert.equal(JSON.stringify(piece),original);
 const report=buildGaugeMotionDiagnostic(piece,{build:'QA-R108',
  samples:[.86,.92,.96]});
 assert.equal(report.operations[2].frames[1].prediction.axisOrder,'X-then-R');
 assert.equal(report.operations[2].frames[1].prediction.routeOptions.length,2);
 assert.equal(report.operations[2].frames[1].motion.axisPhase,'R');
 assert.equal(report.verified,false);
});

test('R108: Omega estándar conserva R→X y los avisos de holgura sin inventar penetraciones',()=>{
 const p=normalized(EXAMPLE);
 const scene=technicalScene(p,5*(2+.92));
 const route=scene.gaugePlan.returnRoute;
 assert.equal(route?.axisOrder,'R-then-X');
 assert.equal(route?.selectedPenetrations,0);
 assert.equal(scene.gaugeTransition?.axisPhase,'X');
 const scan=scanGaugeSequence(p,{samplesPerOperation:24});
 assert.deepEqual(scan.operations.map(o=>o.bend),[0,1,3,2]);
 assert.equal(scan.operations[2].movementWarnings,0);
});

test('R108: un riesgo de ruta completa se informa una sola vez, no por cada frame',()=>{
 const p=normalized(EXAMPLE);
 const report=inspectGaugeOperation(p,0,{samples:18,
  inspect:(_p,time)=>({scene:{
   stage:{activeOperation:0,activeBend:0,phase:'Reposicionamiento'},
   gaugeTransition:null,
   gaugePlan:{movementCollisionUnresolved:true}
  },place:{stopNumber:1,freeEdge:true,sheetInFront:true,
   seat:{seated:true},contactEngaged:false,
   gaugeInterference:{kind:'sin-interferencia-detectada',warning:false}}
  })
 });
 assert.equal(report.samples,19);
 assert.equal(report.warnings,1);
 assert.equal(report.findings.length,1);
 assert.equal(report.findings[0].kind,'ruta-ejes-no-segura-2d');
});
