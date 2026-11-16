import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,DIES,PUNCHES} from '../engine.js';
import {scanToolCriticalPhases,TOOL_CRITICAL_PHASES} from '../tool-collision.js';
import {optimizeBendPlan} from '../integrated-bend-planner.js';
import {makePrism,prismOverlap} from '../volume-engine.js';

const piece=normalized({...EXAMPLE,flanges:[60,80],angles:[90],order:[0]});
const die=DIES.find(x=>x.id===piece.die);
const punch=PUNCHES.find(x=>x.id===piece.punch);
const toolingAdvice={candidates:[{dieId:die.id,punchId:punch.id,
 dieName:die.name,punchName:punch.name,score:0}]};
const common={
 toolingAdvice,maxPairs:1,maxOrders:1,maxFinalists:1,maxVolumeCandidates:1,
 sheetEvaluator:(_part,order)=>({order,score:0,
  counts:{cross:0,overlap:0,touch:0,close:0}}),
 toolEvaluator:part=>({operations:part.order.map(()=>({
  possibleToolIntrusion:false,possibleToolInterference:false,
  samples:3
 }))}),
 gaugeEvaluator:part=>({warningCount:0,contactNotObserved:0,
  operations:part.order.map(()=>({contactObserved:true,findings:[]}))}),
 volumeEvaluator:()=>({modeledMachineWarnings:0,ramWarnings:0,
  bedWarnings:0,gaugeWarnings:0,uncertainSweptIntervals:0,
  framesChecked:16,byKind:{ram:0,bed:0,gauge:0}})
};
const critical=(kind=null)=>()=>({
 operations:[{operation:0,bend:0,framesChecked:TOOL_CRITICAL_PHASES.length,
  findings:kind?[{kind,category:'penetration',segment:1,depth:.7}]:[],
  hasPenetration:!!kind,hasWarning:!!kind}],
 byKind:{punch:{penetrations:kind==='punch'?1:0,warnings:kind==='punch'?1:0},
  die:{penetrations:kind==='die'?1:0,warnings:kind==='die'?1:0}},
 penetrationOperations:kind?1:0,warningOperations:kind?1:0,
 framesChecked:TOOL_CRITICAL_PHASES.length,verified:false
});

test('R108: el cribado crítico incluye arranque de plegado y sujeción',()=>{
 for(const at of [.36,.40,.44,.46,.48,.52,.68,.84])
  assert.ok(TOOL_CRITICAL_PHASES.includes(at),'Falta fase crítica '+at);
 assert.ok(TOOL_CRITICAL_PHASES.length>=12);
});

test('R108: detectar penetración muy breve del punzón en .46',()=>{
 const seen=[];
 const out=scanToolCriticalPhases(piece,{
  phases:[.36,.44,.46,.48,.52],
  inspect:(_part,time)=>{
   seen.push(time);
   const hit=Math.abs(time-5*.46)<1e-8;
   return {issues:hit?[{kind:'punch',category:'penetration',
    segment:1,depth:.5,point:{x:4,y:12}}]:[],
    hasPenetration:hit,hasWarning:hit};
  }
 });
 assert.equal(out.framesChecked,5);
 assert.equal(out.penetrationOperations,1);
 assert.equal(out.warningOperations,1);
 assert.equal(out.byKind.punch.penetrations,1);
 assert.equal(out.byKind.die.penetrations,0);
 assert.ok(seen.some(x=>Math.abs(x-2.3)<1e-8));
 assert.equal(out.operations[0].findings[0].sub,.46);
 assert.equal(out.verified,false);
});

test('R108: clasificar independientemente punzón y matriz',()=>{
 const output=scanToolCriticalPhases(piece,{phases:[.44,.46],
  inspect:(_part,time)=>({issues:Math.abs(time-5*.46)<1e-8?
   [{kind:'punch',category:'clearance',segment:0,depth:.1},
    {kind:'die',category:'penetration',segment:1,depth:.2}]:[]})
 });
 assert.equal(output.byKind.punch.warnings,1);
 assert.equal(output.byKind.punch.penetrations,0);
 assert.equal(output.byKind.die.penetrations,1);
 assert.equal(output.penetrationOperations,1);
});

test('R108: un punzón que penetra impide recomendar la alternativa',()=>{
 const before=JSON.stringify(piece);
 const result=optimizeBendPlan(piece,{...common,
  criticalToolEvaluator:critical('punch')});
 assert.equal(result.best,null);
 assert.equal(result.rejectionSummary.punchPenetration,1);
 assert.equal(result.rejectionSummary.diePenetration,0);
 assert.equal(result.rejectionSummary.toolPenetration,1);
 assert.equal(result.manual.toolCriticalChecked,true);
 assert.ok(result.manual.toolCriticalFindings.some(x=>x.kind==='punch'));
 assert.equal(JSON.stringify(piece),before);
});

test('R108: una penetración de matriz tampoco puede obtener mejor plan',()=>{
 const result=optimizeBendPlan(piece,{...common,
  criticalToolEvaluator:critical('die')});
 assert.equal(result.best,null);
 assert.equal(result.rejectionSummary.diePenetration,1);
});

test('R108: trancha independiente bloquea la recomendación aunque el punzón esté limpio',()=>{
 const result=optimizeBendPlan(piece,{...common,
  criticalToolEvaluator:critical(),
  volumeEvaluator:()=>({modeledMachineWarnings:1,ramWarnings:1,
   bedWarnings:0,gaugeWarnings:0,uncertainSweptIntervals:0,
   framesChecked:16,
   ramEvidence:[{kind:'ram',volumeMm3:12,verified:false}],
   byKind:{ram:1,bed:0,gauge:0}})
 });
 assert.equal(result.best,null);
 assert.equal(result.rejectionSummary.ramInterference,1);
 assert.equal(result.manual.volumeRamWarnings,1);
 assert.equal(result.manual.volumeRamEvidence.length,1);
 assert.equal(result.manual.toolCriticalPenetrations,0);
});

test('R108: una exploración crítica incompleta no puede dar falsos resultados seguros',()=>{
 const result=optimizeBendPlan(piece,{...common,
  criticalToolEvaluator:()=>{throw Error('Perfil punzón no disponible');}});
 assert.equal(result.best,null);
 assert.equal(result.rejectionSummary.toolCriticalUnresolved,1);
 assert.match(result.manual.toolCriticalError,/no disponible/);
});

test('R108: se conserva programa MANUAL aunque haya candidato automático limpio',()=>{
 const result=optimizeBendPlan(piece,{...common,
  criticalToolEvaluator:critical()});
 assert.ok(result.best);
 assert.notStrictEqual(result.manual,result.best);
 assert.deepEqual(result.manual.order,piece.order);
 assert.equal(result.manual.source,'manual');
 assert.equal(result.best.source,'automatico');
 assert.equal(result.manual.toolCriticalChecked,true);
 assert.equal(result.best.toolCriticalChecked,true);
 assert.equal(result.finalistsToolCriticalChecked,2);
 assert.equal(result.verified,false);
 assert.equal(result.canApproveForMachine,false);
});

test('R108: un volumen de trancha separado en Z no se etiqueta como choque',()=>{
 const polygon=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];
 const sheet=makePrism('chapa',polygon,-50,50);
 const ram=makePrism('trancha',polygon,60,90);
 assert.equal(prismOverlap(sheet,ram).intersects,false);
 assert.equal(prismOverlap(sheet,ram).unknown,false);
 const crossing=makePrism('trancha',polygon,0,90);
 assert.equal(prismOverlap(sheet,crossing).intersects,true);
});
