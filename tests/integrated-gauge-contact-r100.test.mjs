import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,DIES,PUNCHES} from '../engine.js';
import {optimizeBendPlan} from '../integrated-bend-planner.js';

const pair=(dieId,punchId,score=0)=>({
 dieId,punchId,dieName:DIES.find(d=>d.id===dieId).name,
 punchName:PUNCHES.find(p=>p.id===punchId).name,score
});
const toolingAdvice={candidates:[pair('v16','goose',0),pair('v12','goose',9)],
 reasons:['Prueba de contacto']};
const sheetEvaluator=(_p,order)=>({order,score:0,
 counts:{cross:0,overlap:0,touch:0,close:0}});
const toolEvaluator=part=>({operations:part.order.map(()=>({
 samples:2,possibleToolIntrusion:false,possibleToolInterference:false
}))});
const volumeEvaluator=()=>({modeledMachineWarnings:0,uncertainSweptIntervals:0,
 framesChecked:8});
const params={toolingAdvice,sheetEvaluator,toolEvaluator,volumeEvaluator,
 maxPairs:2,maxOrders:1,maxFinalists:4};
const report=(gaugeEvaluator)=>optimizeBendPlan(EXAMPLE,{...params,gaugeEvaluator});

test('R100: descartar tope SIN contacto aunque sus muestras no tengan choque',()=>{
 const original=JSON.stringify(EXAMPLE);
 const result=report(piece=>piece.die==='v16'?
  {warningCount:0,contactNotObserved:1,
   operations:[{contactObserved:false,findings:[]}]}:
  {warningCount:0,contactNotObserved:0,
   operations:[{contactObserved:true,findings:[]}]});
 assert.ok(result.best,'Existe una alternativa con apoyo observado');
 assert.equal(result.best.dieId,'v12');
 assert.equal(result.best.gaugeContactNotObserved,0);
 assert.equal(result.manual.gaugeContactNotObserved,1);
 assert.equal(result.manual.possibleInterference,true);
 assert.equal(JSON.stringify(EXAMPLE),original);
});
test('R100: referencia interior inválida NO gana por tener cero penetraciones',()=>{
 const r=report(piece=>piece.die==='v16'?
  {warningCount:1,operations:[{contactObserved:true,
   findings:[{kind:'referencia-interior'}]}]}:
  {warningCount:0,operations:[{contactObserved:true,findings:[]}]});
 assert.equal(r.best.dieId,'v12');
 assert.equal(r.manual.gaugeInvalidReferences,1);
 assert.equal(r.manual.gaugePenetrations,0);
});
test('R100: holgura NO se falsifica como penetración del tope',()=>{
 const r=report(piece=>piece.die==='v16'?
  {warningCount:1,operations:[{contactObserved:true,
   findings:[{kind:'holgura'}]}]}:
  {warningCount:0,operations:[{contactObserved:true,findings:[]}]});
 assert.equal(r.manual.gaugeClearanceWarnings,1);
 assert.equal(r.manual.gaugePenetrations,0);
 assert.equal(r.manual.gaugeInvalidReferences,0);
 assert.equal(r.best.dieId,'v12');
});
test('R100: sin ningún apoyo aceptable, no inventar plan automático seguro',()=>{
 const r=report(()=>({warningCount:0,contactNotObserved:1,
  operations:[{contactObserved:false,findings:[]}]}));
 assert.equal(r.best,null);
 assert.ok(r.manual);
 assert.equal(r.manual.gaugeContactNotObserved,1);
 assert.equal(r.canApproveForMachine,false);
});
