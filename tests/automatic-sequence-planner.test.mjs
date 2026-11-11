import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,profile} from '../engine.js';
import {planBendSequence,planBendSequenceAsync,SEQUENCE_LIMITATIONS} from '../automatic-sequence-planner.js';

const quietGauge=p=>({operations:p.order.map(()=>({findings:[]}))});
const quietTool=p=>({operations:p.order.map(()=>({
 samples:3,possibleToolIntrusion:false,possibleToolInterference:false
}))});
const scene={
 flanges:[50,50,50,50],angles:[90,-90,90],order:[0,1,2],
 thickness:2,material:'s235',die:'v16',punch:'straight88'
};
test('exhaustivo en 4 pliegues: comprueba 24 alternativas también con los útiles y el tope',()=>{
 let tools=0,gauges=0;
 const r=planBendSequence(EXAMPLE,{toolEvaluator:p=>{tools++;return quietTool(p);},
  gaugeEvaluator:p=>{gauges++;return quietGauge(p);},toolSamples:3,gaugeSamples:8});
 assert.equal(r.compared,24);
 assert.equal(r.deepChecked,24);
 assert.equal(tools,24);
 assert.equal(gauges,24);
 assert.equal(r.exhaustive,true);
 assert.equal(r.unassessed,0);
 assert.equal(r.verified,false);
});
test('detecta penalizaciones de punzón/matriz aunque la fibra de chapa no mejore',()=>{
 const original=structuredClone(scene);
 const r=planBendSequence(scene,{toolEvaluator:p=>({
  operations:p.order.map((bend,i)=>({
   samples:3,possibleToolIntrusion:i===0&&bend!==2,
   possibleToolInterference:i===0&&bend!==2
  }))
 }),gaugeEvaluator:quietGauge});
 assert.equal(r.current.tool.penetrationOperations,1);
 assert.equal(r.best.tool.penetrationOperations,0);
 assert.equal(r.order[0],2);
 assert.equal(r.improved,true);
 assert.equal(r.automaticApplicable,true);
 assert.deepEqual(scene,original,'solo devuelve una propuesta; nunca muta el programa');
});
test('detecta tope detrás de chapa aun sin penetración en punzón',()=>{
 const r=planBendSequence(scene,{
  toolEvaluator:quietTool,
  gaugeEvaluator:p=>({operations:p.order.map((bend,i)=>({
   findings:i===0&&bend!==1?[{kind:'chapa-detras'}]:[]
  }))})
 });
 assert.equal(r.current.gauge['chapa-detras'],1);
 assert.equal(r.best.gauge['chapa-detras'],0);
 assert.equal(r.order[0],1);
 assert.equal(r.improved,true);
});
test('fallo del cálculo de herramientas o topes: no inventar seguridad ni aplicar',()=>{
 const r=planBendSequence(scene,{toolEvaluator:quietTool,gaugeEvaluator:()=>{
  throw Error('tope sin perfil');
 }});
 assert.equal(r.incomplete,true);
 assert.equal(r.automaticApplicable,false);
 assert.equal(r.current.unavailable,true);
 assert.deepEqual(r.order,scene.order);
});
test('la forma final imposible no se presenta como corregible por orden',()=>{
 const p={flanges:[50,50,50,50],angles:[140,140,140],order:[0,1,2],
  thickness:2,die:'v16',punch:'straight88'};
 const r=planBendSequence(p,{toolEvaluator:quietTool,gaugeEvaluator:quietGauge});
 assert.equal(r.finalGeometryAffected,true);
 assert.ok(r.finalRisks.cross>0);
 assert.equal(r.automaticApplicable,false);
});
test('hasta 20 golpes se limita búsqueda profunda y se conserva el original',()=>{
 const n=20,p={flanges:Array(n+1).fill(50),angles:Array(n).fill(90),
  order:Array.from({length:n},(_,i)=>i),thickness:2};
 const r=planBendSequence(p,{maxCandidates:40,maxDeepCandidates:4,
  toolEvaluator:quietTool,gaugeEvaluator:quietGauge});
 assert.equal(r.compared,40);
 assert.equal(r.deepChecked,4);
 assert.equal(r.exhaustive,false);
 assert.ok(r.unassessed>0);
 assert.equal(r.verified,false);
});
test('progreso asíncrono, cancelación y límites transparentes',async()=>{
 let progress=0;
 const r=await planBendSequenceAsync(scene,{toolEvaluator:quietTool,
  gaugeEvaluator:quietGauge,onProgress:()=>progress++});
 assert.equal(progress,r.deepChecked);
 assert.match(r.method,/NO verifica|No verifica|No equivale/);
 assert.match(SEQUENCE_LIMITATIONS,/CNC/);
 const cancelled=await planBendSequenceAsync(scene,{toolEvaluator:quietTool,
  gaugeEvaluator:quietGauge,cancelled:()=>true});
 assert.equal(cancelled,null);
});
