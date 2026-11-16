import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,DIES,PUNCHES,normalized} from '../engine.js';
import {optimizeBendPlan} from '../integrated-bend-planner.js';
import {reconcileCriticalToolEvidence,reconcileVolumeEvidence,
 reconcileGaugeEvidence,summarizePhysicalEvidence} from '../planner-evidence-integrity.js';
const p=normalized({...EXAMPLE,flanges:[60,80],angles:[90],order:[0]});
const currentDie=DIES.find(x=>x.id===p.die);
const currentPunch=PUNCHES.find(x=>x.id===p.punch);
const toolingAdvice={candidates:[{dieId:currentDie.id,punchId:currentPunch.id,
 dieName:currentDie.name,punchName:currentPunch.name,score:0}],reasons:[]};
const critical=()=>({operations:[{operation:0,bend:0,findings:[],
 hasPenetration:false,hasWarning:false}],framesChecked:8,
 penetrationOperations:0,warningOperations:0});
const volume=()=>({operations:[{operation:0,bend:0,findings:[]}],
 modeledMachineWarnings:0,uncertainSweptIntervals:0,
 framesChecked:8,missingCadComponents:['ram','bed','stop'],
 axisReport:{checked:false,violations:[]},
 axisGeometry:{checked:false,events:[]}});
const base={
 toolingAdvice,maxPairs:1,maxOrders:1,maxFinalists:1,
 maxVolumeCandidates:1,
 sheetEvaluator:(_piece,order)=>({order,score:0,counts:{cross:0,overlap:0}}),
 toolEvaluator:part=>({operations:part.order.map(()=>({
  possibleToolIntrusion:false,possibleToolInterference:false}))}),
 gaugeEvaluator:()=>({warningCount:0,contactNotObserved:0,operations:[{
  contactObserved:true,findings:[]}]}),
 criticalToolEvaluator:critical,volumeEvaluator:volume
};
test('R114: una penetración detallada de punzón prevalece sobre resumen de cero',()=>{
 const e=reconcileCriticalToolEvidence({operations:[{
  operation:0,bend:0,hasPenetration:false,
  findings:[{kind:'punch',category:'penetration',depth:.2}]}],
  penetrationOperations:0,warningOperations:0,byKind:{punch:{penetrations:0}}},1);
 assert.equal(e.penetrationOperations,1);
 assert.equal(e.byKind.punch.penetrations,1);
 assert.equal(e.warningOperations,1);
 assert.equal(e.verified,false);
});
test('R114: no convierte simple aviso de holgura en penetración de punzón',()=>{
 const e=reconcileCriticalToolEvidence({operations:[{
  operation:0,bend:0,hasWarning:true,
  findings:[{kind:'die',category:'clearance',depth:.1}]}],
  penetrationOperations:0,warningOperations:0},1);
 assert.equal(e.penetrationOperations,0);
 assert.equal(e.byKind.die.warnings,1);
 assert.equal(e.warningOperations,1);
});
test('R114: intervalos no resueltos son desconocidos, NO colisión inventada',()=>{
 const e=reconcileVolumeEvidence({operations:[{findings:[
  {kind:'ram',severity:'intervalo-barrido-no-resuelto'},
  {kind:'upperClamp',severity:'geometria-invalida'}]}],
  modeledMachineWarnings:0,uncertainSweptIntervals:0});
 assert.equal(e.modeledMachineWarnings,0);
 assert.equal(e.uncertainSweptIntervals,2);
});
test('R114: el detalle de la trancha y eventos CNC prevalece sobre contador cero',()=>{
 const e=reconcileVolumeEvidence({operations:[{operation:0,bend:0,
  findings:[{kind:'ram',severity:'interferencia-envolvente',volumeMm3:2}]}],
  modeledMachineWarnings:0,ramWarnings:0,axisViolationCount:0,
  axisReport:{violations:[{kind:'travel-limit'}]},
  axisModeledCollisions:0,axisGeometry:{events:[{moving:'ram',against:'bed'}]}});
 assert.equal(e.modeledMachineWarnings,1);
 assert.equal(e.ramWarnings,1);
 assert.equal(e.axisViolations,1);
 assert.equal(e.axisModeledCollisions,1);
 assert.equal(e.ramEvidence.length,1);
});
test('R114: falta de contacto vista en operación invalida contador agregado de cero',()=>{
 const e=reconcileGaugeEvidence({contactNotObserved:0,
  operations:[{contactObserved:false,findings:[]}]});
 assert.equal(e.contactNotObserved,1);
});
test('R114: planificador rechaza intrusión detallada aun cuando el resumen dice cero',()=>{
 const r=optimizeBendPlan(p,{...base,
  criticalToolEvaluator:()=>({operations:[{operation:0,bend:0,
   findings:[{kind:'punch',category:'penetration'}]}],
   penetrationOperations:0,warningOperations:0})
 });
 assert.equal(r.best,null);
 assert.equal(r.rejectionSummary.toolPenetration,1);
 assert.equal(r.rejectionSummary.punchPenetration,1);
 assert.equal(r.manual.physicalReview.status,'INTERFERENCIA_MODELADA');
});
test('R114: planificador bloquea choque de trancha listado pero omitido del contador',()=>{
 const r=optimizeBendPlan(p,{...base,
  volumeEvaluator:()=>({modeledMachineWarnings:0,ramWarnings:0,
   operations:[{operation:0,bend:0,
    findings:[{kind:'ram',severity:'penetracion-barrido-lineal-modelado'}]}]})
 });
 assert.equal(r.best,null);
 assert.equal(r.rejectionSummary.ramInterference,1);
});
test('R114: planificador no confunde cero declarado con contacto ausente de tope',()=>{
 const r=optimizeBendPlan(p,{...base,gaugeEvaluator:()=>({
  contactNotObserved:0,warningCount:0,
  operations:[{contactObserved:false,findings:[]}]})});
 assert.equal(r.best,null);
 assert.equal(r.status,'SIN_APOYO_NOMINAL_2D_VIABLE');
});
test('R114: plan provisional limpio identifica CAD incompleto y conserva decisión manual',()=>{
 const r=optimizeBendPlan(p,base);
 assert.ok(r.best);
 assert.equal(r.best.physicalReview.status,'MODELO_FISICO_INCOMPLETO');
 assert.ok(r.best.physicalReview.unknown.some(x=>x.includes('CAD')));
 assert.equal(r.best.physicalReview.collisions.length,0);
 assert.equal(r.best.physicalReview.canApproveForMachine,false);
 assert.ok(r.manual);
 assert.notStrictEqual(r.manual,r.best);
});
test('R114: la ausencia de asiento es distinta de una penetración física',()=>{
 const review=summarizePhysicalEvidence({gaugeContactNotObserved:1,
  gaugeChecked:true,toolCriticalChecked:true,volumeChecked:true,
  axisChecked:true,axisGeometryChecked:true,
  cadProfilesUsed:['ram'],cadMissing:[],toolingMountVerified:false,
  toolGeometryVerified:false});
 assert.equal(review.status,'APOYO_DE_TOPE_INVALIDO');
 assert.deepEqual(review.collisions,[]);
 assert.ok(review.supportProblems.some(x=>x.includes('contacto')));
});
