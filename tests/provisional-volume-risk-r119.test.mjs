import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,DIES,PUNCHES,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {inspectVolumeFrame} from '../volume-engine.js';
import {scanVolumeTrajectory} from '../volume-trajectory-review.js';
import {reconcileVolumeEvidence} from '../planner-evidence-integrity.js';
import {optimizeBendPlan} from '../integrated-bend-planner.js';

const piece=normalized({...EXAMPLE,flanges:[60,80],angles:[90],order:[0]});
const setup=()=>{
 const scene=technicalScene(piece,1);
 const top=scene.kinematics.tipHeight+scene.punch.height;
 return {...scene,sheetDisplay:[{x:-20,y:top+25},{x:20,y:top+25}]};
};
test('R119: solape volumétrico contra trancha SIN CAD es AVISO PROVISIONAL, no penetración acreditada',()=>{
 const r=inspectVolumeFrame(setup(),{machineCAD:{}});
 const hit=r.issues.find(x=>x.kind==='ram'&&x.volumeMm3>0);
 assert.ok(hit,'El ensayo debe producir un solape real en la envolvente ilustrativa');
 assert.equal(hit.severity,'solape-envolvente-provisional');
 assert.match(hit.evidence,/sin-CAD/);
 assert.equal(hit.verified,false);
});
test('R119: CAD geométrico importado conserva categoría de interferencia modelada',()=>{
 const scene=setup();
 const h=scene.punch.height;
 const ram={kind:'ram',source:'PERFIL SINTÉTICO DE ENSAYO, NO OEM',
  points:[[-40,h+10],[40,h+10],[40,h+45],[-40,h+45]],
  offsetX:0,offsetY:0,zMin:-100,zMax:100};
 const r=inspectVolumeFrame(scene,{machineCAD:{ram}});
 const hit=r.issues.find(x=>x.kind==='ram'&&x.volumeMm3>0);
 assert.ok(hit);
 assert.equal(hit.severity,'interferencia-envolvente');
 assert.equal(hit.verified,false);
 assert.equal(r.canApproveForMachine,false);
});
test('R119: barrido no atribuye colisión confirmada a un tope esquemático',()=>{
 const report=scanVolumeTrajectory(piece,{samplesPerOperation:4,
  inspect:()=>({model:null,issues:[{
   kind:'gauge',severity:'solape-envolvente-provisional',
   evidence:'Z desconocida, dedo esquemático',volumeMm3:25}]})});
 assert.equal(report.modeledMachineWarnings,0);
 assert.equal(report.gaugeWarnings,0);
 assert.equal(report.provisionalMachineWarnings,1);
 assert.equal(report.provisionalGaugeWarnings,1);
 const e=reconcileVolumeEvidence(report);
 assert.equal(e.modeledMachineWarnings,0);
 assert.equal(e.provisionalMachineWarnings,1);
 assert.equal(e.provisionalGaugeWarnings,1);
});
test('R119: incertidumbre no se pierde si aparece una colisión confirmada DESPUÉS en el mismo cuerpo',()=>{
 let frame=0;
 const report=scanVolumeTrajectory(piece,{samplesPerOperation:4,
  inspect:()=>({model:null,issues:[{kind:'ram',severity:frame++===0?
   'geometria-invalida':'interferencia-envolvente'}]})});
 assert.equal(report.ramWarnings,1);
 assert.ok(report.unresolvedGeometryFindings>=1);
 assert.ok(reconcileVolumeEvidence(report).uncertainSweptIntervals>=1);
});
test('R119: solape provisional bloquea recomendación, sin inventar colisión física',()=>{
 const die=DIES.find(x=>x.id===piece.die);
 const punch=PUNCHES.find(x=>x.id===piece.punch);
 const out=optimizeBendPlan(piece,{
  toolingAdvice:{candidates:[{dieId:die.id,punchId:punch.id,
   dieName:die.name,punchName:punch.name,score:0}]},
  maxPairs:1,maxOrders:1,maxFinalists:1,maxVolumeCandidates:1,
  sheetEvaluator:(_,order)=>({order,score:0,
   counts:{cross:0,overlap:0}}),
  toolEvaluator:p=>({operations:p.order.map(()=>({
   possibleToolIntrusion:false,possibleToolInterference:false}))}),
  gaugeEvaluator:p=>({contactNotObserved:0,warningCount:0,
   operations:p.order.map((bend,operation)=>({
    bend,operation,contactObserved:true,findings:[]}))}),
  criticalToolEvaluator:p=>({operations:p.order.map((bend,operation)=>({
   bend,operation,findings:[],hasPenetration:false,hasWarning:false})),
   framesChecked:10,penetrationOperations:0,warningOperations:0}),
  volumeEvaluator:()=>({framesChecked:12,modeledMachineWarnings:0,
   provisionalMachineWarnings:1,provisionalRamWarnings:1,
   provisionalByKind:{ram:1},uncertainSweptIntervals:0,
   axisReport:{checked:false,violations:[]},
   axisGeometry:{checked:false,events:[]}})
 });
 assert.equal(out.best,null);
 assert.equal(out.rejectionSummary.provisionalEnvelopeRisk,1);
 assert.equal(out.rejectionSummary.provisionalRamRisk,1);
 assert.equal(out.rejectionSummary.ramInterference,0);
 assert.equal(out.manual.volumeMachineWarnings,0);
 assert.equal(out.manual.volumeProvisionalWarnings,1);
 assert.equal(out.manual.physicalReview.collisions.length,0);
 assert.equal(out.manual.physicalReview.status,'MODELO_FISICO_INCOMPLETO');
 assert.ok(out.manual.physicalReview.unknown.some(x=>x.includes('envolvente provisional')));
 assert.equal(out.canApproveForMachine,false);
});
