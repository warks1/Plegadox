import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,DIES,PUNCHES} from '../engine.js';
import {optimizeBendPlan} from '../integrated-bend-planner.js';
const die=id=>DIES.find(t=>t.id===id);
const punch=id=>PUNCHES.find(t=>t.id===id);
const toolingAdvice={candidates:['v16','v12'].map((id,i)=>({
 dieId:id,punchId:'goose',dieName:die(id).name,punchName:punch('goose').name,score:i
}))};
const sheetEvaluator=(_piece,order)=>({order,score:0,
 counts:{cross:0,overlap:0,touch:0,close:0}});
const volumeEvaluator=()=>({modeledMachineWarnings:0,uncertainSweptIntervals:0,framesChecked:8});
const options={toolingAdvice,sheetEvaluator,volumeEvaluator,
 maxPairs:2,maxOrders:1,maxFinalists:2};
test('R101: no hay contacto nominal en ninguna alternativa: diagnóstico explícito',()=>{
 const p=EXAMPLE,before=JSON.stringify(p);
 const report=optimizeBendPlan(p,{...options,
  toolEvaluator:part=>({operations:part.order.map(()=>({
   possibleToolIntrusion:false,possibleToolInterference:false}))}),
  gaugeEvaluator:part=>({warningCount:0,contactNotObserved:1,
   operations:part.order.map((bend,operation)=>({bend,operation,
    contactObserved:operation!==0,findings:[]}))})
 });
 assert.equal(report.best,null);
 assert.equal(report.status,'SIN_APOYO_NOMINAL_2D_VIABLE');
 assert.equal(report.rejectionSummary.noGaugeContact,2);
 assert.equal(report.rejectionSummary.invalidGaugeReference,0);
 assert.equal(JSON.stringify(p),before);
});
test('R101: apoyo presente y punzón incompatible: no llamarlo ausencia de tope',()=>{
 const report=optimizeBendPlan(EXAMPLE,{...options,
  toolEvaluator:part=>({operations:part.order.map(()=>({
   possibleToolIntrusion:true,possibleToolInterference:true}))}),
  gaugeEvaluator:part=>({warningCount:0,contactNotObserved:0,
   operations:part.order.map((bend,operation)=>({bend,operation,
    contactObserved:true,findings:[]}))})
 });
 assert.equal(report.best,null);
 assert.equal(report.status,'SIN_PLAN_SIN_PENETRACIONES_MODELADAS');
 assert.ok(report.rejectionSummary.toolPenetration>0);
 assert.equal(report.rejectionSummary.noGaugeContact,0);
});
test('R101: referencia interior inválida explica rechazo sin inventar penetración',()=>{
 const report=optimizeBendPlan(EXAMPLE,{...options,
  toolEvaluator:part=>({operations:part.order.map(()=>({
   possibleToolIntrusion:false,possibleToolInterference:false}))}),
  gaugeEvaluator:part=>({warningCount:1,contactNotObserved:0,
   operations:part.order.map((bend,operation)=>({bend,operation,
    contactObserved:true,findings:operation===0?
     [{kind:'referencia-interior'}]:[]}))})
 });
 assert.equal(report.best,null);
 assert.equal(report.status,'SIN_APOYO_NOMINAL_2D_VIABLE');
 assert.equal(report.rejectionSummary.invalidGaugeReference,2);
 assert.equal(report.rejectionSummary.gaugePenetration,0);
});
