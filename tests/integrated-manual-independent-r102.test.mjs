import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,DIES,PUNCHES} from '../engine.js';
import {optimizeBendPlan} from '../integrated-bend-planner.js';

const part=normalized({...EXAMPLE,flanges:[60,80],angles:[90],order:[0]});
const die=DIES.find(x=>x.id===part.die);
const punch=PUNCHES.find(x=>x.id===part.punch);
const toolingAdvice={candidates:[{
 dieId:die.id,punchId:punch.id,dieName:die.name,
 punchName:punch.name,score:0
}]};
const sheetEvaluator=(_part,order)=>({order,score:0,
 counts:{cross:0,overlap:0,touch:0,close:0}});
const toolEvaluator=candidate=>({operations:candidate.order.map(()=>({
 possibleToolIntrusion:false,possibleToolInterference:false
}))});
const volumeEvaluator=()=>({modeledMachineWarnings:0,
 uncertainSweptIntervals:0,framesChecked:8});

test('R102: coincidir con la alternativa automática no borra el plan manual',()=>{
 const gaugeCalls=[];
 const report=optimizeBendPlan(part,{
  toolingAdvice,sheetEvaluator,toolEvaluator,volumeEvaluator,
  gaugeEvaluator:candidate=>{
   gaugeCalls.push(candidate.order.join(','));
   return {warningCount:0,contactNotObserved:0,
    operations:candidate.order.map(()=>({contactObserved:true,findings:[]}))};
  },
  maxPairs:1,maxOrders:1,maxFinalists:1,maxVolumeCandidates:1
 });
 assert.ok(report.best,'Existe alternativa automática sin bloqueos modelados');
 assert.ok(report.manual,'El programa manual debe evaluarse siempre');
 assert.equal(report.best.source,'automatico');
 assert.equal(report.manual.source,'manual');
 assert.notStrictEqual(report.best,report.manual,
  'El plan manual no puede ser un alias de la alternativa automática');
 assert.deepEqual(report.manual.order,part.order);
 assert.equal(report.manual.dieId,part.die);
 assert.equal(report.manual.punchId,part.punch);
 assert.equal(report.finalistsGaugeChecked,2,
  'Ambos programas conservan una comprobación de tope independiente');
 assert.equal(report.finalistsVolumeChecked,2,
  'Ambos programas conservan una evaluación volumétrica independiente');
 assert.equal(gaugeCalls.length,2);
 assert.equal(report.rejectionSummary.noGaugeContact,0);
});

test('R102: el resumen de rechazos no cuenta una segunda vez el plan manual',()=>{
 const report=optimizeBendPlan(part,{
  toolingAdvice,sheetEvaluator,toolEvaluator,volumeEvaluator,
  gaugeEvaluator:()=>({warningCount:0,contactNotObserved:1,
   operations:[{contactObserved:false,findings:[]}]}),
  maxPairs:1,maxOrders:1,maxFinalists:1,maxVolumeCandidates:1
 });
 assert.equal(report.best,null);
 assert.equal(report.manual.source,'manual');
 assert.equal(report.rejectionSummary.noGaugeContact,1,
  'El manual no se contabiliza como otra variante automática');
 assert.equal(report.finalistsGaugeChecked,2);
});
