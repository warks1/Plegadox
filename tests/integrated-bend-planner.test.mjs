import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,DIES,PUNCHES} from '../engine.js';
import {optimizeBendPlan,applyBendPlan} from '../integrated-bend-planner.js';

const pair=(dieId,punchId,score=0)=>({
 dieId,punchId,dieName:DIES.find(d=>d.id===dieId).name,
 punchName:PUNCHES.find(p=>p.id===punchId).name,score
});
const guidance=(...pairs)=>({choice:pairs[0]||null,
 candidates:pairs,alternatives:pairs.slice(1),reasons:['Ensayo controlado']});
const sheet=(_piece,order)=>({order,score:0,
 counts:{cross:0,overlap:0,touch:0,close:0},verified:false});
const gauge=()=>({warningCount:0,contactNotObserved:0,operations:[]});
const tool=piece=>({operations:piece.order.map(()=>({
 samples:2,possibleToolIntrusion:piece.punch==='straight88',
 possibleToolInterference:piece.punch==='straight88'
}))});
test('la optimización compara punzón, matriz y secuencia sin alterar pieza',()=>{
 const initial=structuredClone(EXAMPLE);
 const report=optimizeBendPlan(EXAMPLE,{
  toolingAdvice:guidance(pair('v16','straight88'),pair('v12','goose',2)),
  sheetEvaluator:sheet,toolEvaluator:tool,gaugeEvaluator:gauge,
  maxPairs:2,maxOrders:2
 });
 assert.deepEqual(EXAMPLE,initial);
 assert.equal(report.candidatePairs,2);
 assert.equal(report.best.punchId,'goose','No elegir el útil con penetración detectada');
 assert.equal(report.best.toolPenetrations,0);
 assert.equal(report.manual.punchId,'straight88');
 assert.ok(report.manual.toolPenetrations>0);
 assert.equal(report.verified,false);
 assert.equal(report.canApproveForMachine,false);
 const programmed=applyBendPlan(EXAMPLE,report.best);
 assert.equal(programmed.punch,'goose');
 assert.equal(programmed.die,'v12');
 assert.deepEqual(programmed.order,report.best.order);
 assert.deepEqual(programmed.angles,EXAMPLE.angles,'No invertir signos de pliegues');
 assert.deepEqual(EXAMPLE,initial,'Aplicación inmutable');
});
test('el cribado de tope influye en elegir una pareja frente a otra',()=>{
 const report=optimizeBendPlan(EXAMPLE,{
  toolingAdvice:guidance(pair('v16','goose',0),pair('v12','goose',5)),
  sheetEvaluator:sheet,
  toolEvaluator:piece=>({operations:piece.order.map(()=>({
   samples:1,possibleToolIntrusion:false,possibleToolInterference:false
  }))}),
  gaugeEvaluator:piece=>piece.die==='v16'?
   {warningCount:1,operations:[{findings:[{kind:'penetracion'}]}]}:gauge(),
  maxOrders:1,maxPairs:2,maxFinalists:5
 });
 assert.equal(report.best.dieId,'v12');
 assert.equal(report.best.gaugeWarnings,0);
 assert.equal(report.best.gaugeChecked,true);
});
test('sin pares recomendables, informa limitación y conserva selección manual',()=>{
 const r=optimizeBendPlan(EXAMPLE,{
  toolingAdvice:guidance(),
  sheetEvaluator:sheet,toolEvaluator:tool,gaugeEvaluator:gauge
 });
 assert.equal(r.best,null);
 assert.equal(r.status,'SIN_PAREJA_PRESELECCIONADA');
 assert.equal(r.manual.punchId,EXAMPLE.punch);
});
test('la búsqueda permanece acotada en piezas complejas',()=>{
 const part={...EXAMPLE,flanges:Array(20).fill(35),
  angles:Array(19).fill(90),order:Array.from({length:19},(_,i)=>i)};
 const r=optimizeBendPlan(part,{
  toolingAdvice:guidance(pair('v16','straight88'),pair('v12','goose')),
  sheetEvaluator:sheet,toolEvaluator:tool,gaugeEvaluator:gauge,
  maxPairs:1,maxOrders:2,maxFinalists:2
 });
 assert.ok(r.planVariantsChecked<=4);
 assert.equal(r.pairsScreened,1);
 assert.equal(r.ordersScreened,2);
 assert.equal(r.truncated,true);
 assert.deepEqual(part.order,Array.from({length:19},(_,i)=>i));
});
test('un plan inválido no cambia el programa',()=>{
 assert.throws(()=>applyBendPlan(EXAMPLE,{dieId:'v16',punchId:'straight88',
  orientation:'normal',order:[0,0,1,2]}),/incompatible/);
 assert.throws(()=>applyBendPlan(EXAMPLE,{dieId:'v99',punchId:'straight88',
  orientation:'normal',order:EXAMPLE.order}),/incompatible/);
});
test('los punzones pata de cabra se exploran en las dos orientaciones',()=>{
 const r=optimizeBendPlan(EXAMPLE,{
  toolingAdvice:guidance(pair('v16','goose')),
  sheetEvaluator:sheet,gaugeEvaluator:gauge,
  toolEvaluator:part=>({operations:part.order.map(()=>({
   samples:1,possibleToolIntrusion:part.punchOrientation==='normal',
   possibleToolInterference:part.punchOrientation==='normal'
  }))}),maxOrders:1
 });
 assert.equal(r.best.orientation,'reversed');
 assert.equal(r.best.toolPenetrations,0);
 assert.equal(EXAMPLE.punchOrientation,undefined,'No se muta el original');
});
