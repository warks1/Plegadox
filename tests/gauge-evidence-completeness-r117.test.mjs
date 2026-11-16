import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,DIES,PUNCHES,normalized} from '../engine.js';
import {optimizeBendPlan} from '../integrated-bend-planner.js';
import {reconcileGaugeEvidence} from '../planner-evidence-integrity.js';

const part=normalized({...EXAMPLE,flanges:[60,80],angles:[90],order:[0]});
const d=DIES.find(x=>x.id===part.die),p=PUNCHES.find(x=>x.id===part.punch);
const common={
 toolingAdvice:{candidates:[{dieId:d.id,punchId:p.id,
  dieName:d.name,punchName:p.name,score:0}],reasons:[]},
 maxPairs:1,maxOrders:1,maxFinalists:1,maxVolumeCandidates:1,
 sheetEvaluator:(_piece,order)=>({order,score:0,
  counts:{cross:0,overlap:0,touch:0,close:0}}),
 toolEvaluator:piece=>({operations:piece.order.map(()=>({
  possibleToolIntrusion:false,possibleToolInterference:false}))}),
 criticalToolEvaluator:piece=>({operations:piece.order.map((bend,operation)=>({
  bend,operation,findings:[],hasPenetration:false,hasWarning:false})),
  penetrationOperations:0,warningOperations:0,framesChecked:8}),
 volumeEvaluator:()=>({modeledMachineWarnings:0,uncertainSweptIntervals:0,
  framesChecked:10,axisReport:{checked:false,violations:[]},
  axisGeometry:{checked:false,events:[]}})
};
const nominal=()=>({warningCount:0,contactNotObserved:0,
 operations:[{operation:0,contactObserved:true,findings:[]}]});
test('R117: un contador de contacto cero sin operaciones es INSUFICIENTE',()=>{
 const e=reconcileGaugeEvidence({contactNotObserved:0,operations:[]},1);
 assert.equal(e.contactNotObserved,0);
 assert.equal(e.missingOperationCount,1);
 assert.equal(e.incompleteContactData,true);
});
test('R117: no inferir un contacto demostrado desde una operación sin booleano',()=>{
 const e=reconcileGaugeEvidence({contactNotObserved:0,
  operations:[{operation:0,findings:[]}]},1);
 assert.equal(e.unexplainedOperations,1);
 assert.equal(e.incompleteContactData,true);
});
test('R117: los cuatro apoyos explícitamente observados cuentan como datos completos',()=>{
 const e=reconcileGaugeEvidence({contactNotObserved:0,
  operations:Array.from({length:4},(_,i)=>({operation:i,
   contactObserved:true,findings:[]}))},4);
 assert.equal(e.incompleteContactData,false);
 assert.equal(e.contactNotObserved,0);
});
test('R117: referencia de tope AUSENTE impide recomendar, sin inventar choque',()=>{
 const report=optimizeBendPlan(part,{...common,gaugeEvaluator:()=>({
  warningCount:0,contactNotObserved:0,operations:[]})});
 assert.equal(report.best,null);
 assert.equal(report.rejectionSummary.gaugeContactIncomplete,1);
 assert.equal(report.rejectionSummary.gaugePenetration,0);
 assert.equal(report.rejectionSummary.noGaugeContact,0);
 assert.equal(report.status,'SIN_APOYO_NOMINAL_2D_VIABLE');
 assert.equal(report.manual.gaugeContactUnknown,true);
 assert.equal(report.manual.physicalReview.status,'MODELO_FISICO_INCOMPLETO');
 assert.ok(report.manual.physicalReview.unknown.some(x=>x.includes('Contacto de tope')));
});
test('R117: un contacto frontal explícito permite comparar alternativas sin autorizar CNC',()=>{
 const report=optimizeBendPlan(part,{...common,gaugeEvaluator:nominal});
 assert.ok(report.best,'Puede proponer una alternativa orientativa sin incidencias modeladas');
 assert.equal(report.rejectionSummary.gaugeContactIncomplete,0);
 assert.equal(report.best.gaugeContactUnknown,false);
 assert.equal(report.best.verified,false);
 assert.equal(report.canApproveForMachine,false);
});
test('R117: datos parciales en una omega no se extrapolan al resto de pliegues',()=>{
 const report=optimizeBendPlan(EXAMPLE,{...common,
  gaugeEvaluator:()=>({warningCount:0,contactNotObserved:0,
   operations:[{operation:0,contactObserved:true,findings:[]}]})});
 assert.equal(report.best,null);
 assert.ok(report.rejectionSummary.gaugeContactIncomplete>0);
 assert.equal(report.manual.gaugeMissingOperations,3);
});
