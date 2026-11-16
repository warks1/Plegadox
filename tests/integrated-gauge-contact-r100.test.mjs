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
const criticalMock=piece=>({
 operations:piece.order.map((bend,operation)=>({bend,operation,findings:[]})),
 framesChecked:piece.order.length*10,penetrationOperations:0,warningOperations:0
});
const params={criticalToolEvaluator:criticalMock,toolingAdvice,sheetEvaluator,toolEvaluator,volumeEvaluator,
 maxPairs:2,maxOrders:1,maxFinalists:4};
const report=(gaugeEvaluator)=>optimizeBendPlan(EXAMPLE,{...params,gaugeEvaluator});
// El caso sintético describe un solo apoyo problemático. Los otros
// golpes también deben declarar expresamente su contacto válido.
const mockedGauge=(piece,{firstContact=true,kind=null}={})=>({
 warningCount:kind||!firstContact?1:0,
 contactNotObserved:firstContact?0:1,
 operations:piece.order.map((bend,operation)=>({
  operation,bend,contactObserved:operation===0?firstContact:true,
  findings:operation===0&&kind?[{kind}]:[]
 }))
});

test('R100: descartar tope SIN contacto aunque sus muestras no tengan choque',()=>{
 const original=JSON.stringify(EXAMPLE);
 const result=report(piece=>mockedGauge(piece,{
  firstContact:piece.die!=='v16'}));
 assert.ok(result.best,'Existe una alternativa con apoyo observado');
 assert.equal(result.best.dieId,'v12');
 assert.equal(result.best.gaugeContactNotObserved,0);
 assert.equal(result.manual.gaugeContactNotObserved,1);
 assert.equal(result.manual.possibleInterference,true);
 assert.equal(JSON.stringify(EXAMPLE),original);
});
test('R100: referencia interior inválida NO gana por tener cero penetraciones',()=>{
 const r=report(piece=>mockedGauge(piece,{
  kind:piece.die==='v16'?'referencia-interior':null}));
 assert.equal(r.best.dieId,'v12');
 assert.equal(r.manual.gaugeInvalidReferences,1);
 assert.equal(r.manual.gaugePenetrations,0);
});
test('R100: holgura NO se falsifica como penetración del tope',()=>{
 const r=report(piece=>mockedGauge(piece,{
  kind:piece.die==='v16'?'holgura':null}));
 assert.equal(r.manual.gaugeClearanceWarnings,1);
 assert.equal(r.manual.gaugePenetrations,0);
 assert.equal(r.manual.gaugeInvalidReferences,0);
 assert.equal(r.best.dieId,'v12');
});
test('R100: sin ningún apoyo aceptable, no inventar plan automático seguro',()=>{
 const r=report(piece=>mockedGauge(piece,{firstContact:false}));
 assert.equal(r.best,null);
 assert.ok(r.manual);
 assert.equal(r.manual.gaugeContactNotObserved,1);
 assert.equal(r.canApproveForMachine,false);
});
