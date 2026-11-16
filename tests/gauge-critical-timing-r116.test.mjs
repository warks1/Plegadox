import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {inspectGaugeOperation,scanGaugeSequence} from '../gauge-sequence-review.js';
import {readFileSync} from 'node:fs';

const evaluator=(seen,{hitAt=null,contact=true}={})=>(part,time)=>{
 seen.push(time);
 const op=Math.min(part.order.length-1,Math.floor(time/5));
 const phase=time%5>=4.2?'Retorno':'Aproximación';
 const penetration=hitAt!==null&&Math.abs(time/5-op-hitAt)<1e-7;
 return {scene:{stage:{activeOperation:op,activeBend:part.order[op],phase},
  gaugeTransition:phase==='Retorno'?
   {phase:'reubicacion-siguiente-golpe',moving:true}:null},
  place:{stopNumber:part.stopByBend[part.order[op]],setupValid:true,
   freeEdge:true,sheetInFront:true,seat:{seated:true},
   contactEngaged:contact&&phase==='Aproximación',
   gaugeInterference:{kind:penetration?'penetracion':'sin-interferencia-detectada',
    warning:penetration,point:penetration?{x:20,y:0}:null}}};
};

test('R116: con 8 muestras se inspecciona obligatoriamente la sujeción .44, .46 y .48',()=>{
 const seen=[];
 const r=inspectGaugeOperation(EXAMPLE,0,{
  samples:8,inspect:evaluator(seen)});
 for(const at of [0,.36,.40,.44,.46,.48,.84,.92])
  assert.ok(seen.some(t=>Math.abs(t-5*at)<1e-7),'Falta fase '+at);
 assert.equal(r.samples,9);
 assert.equal(new Set(seen).size,9);
});

test('R116: no se pierde penetración breve del dedo en el cierre .46 con presupuesto reducido',()=>{
 const seen=[];
 const r=inspectGaugeOperation(EXAMPLE,0,{
  samples:8,inspect:evaluator(seen,{hitAt:.46})});
 assert.ok(r.findings.some(f=>f.kind==='penetracion'));
 assert.equal(r.example.kind,'penetracion');
 assert.ok(Math.abs(r.example.time-2.3)<1e-7);
 assert.equal(r.contactObserved,true);
 assert.equal(r.possibleInterference,true);
});

test('R116: el mismo barrido de 8 poses mantiene orden y signo en las cuatro operaciones',()=>{
 const seen=[];
 const piece=JSON.parse(JSON.stringify(EXAMPLE));
 const result=scanGaugeSequence(piece,{samplesPerOperation:8,
  inspect:evaluator(seen,{hitAt:.48})});
 assert.equal(result.operations.length,4);
 assert.deepEqual(result.operations.map(o=>o.bend),EXAMPLE.order);
 assert.equal(result.operations.every(o=>o.samples===9),true);
 assert.equal(result.operations.every(o=>o.findings.some(f=>f.kind==='penetracion')),true);
 assert.equal(result.verified,false);
 assert.deepEqual(piece,EXAMPLE);
});

test('R116: si no hay alternativa, la interfaz informa del cálculo 3D realmente realizado',()=>{
 const ui=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(ui,/status\.textContent\+=' Revisión de envolventes 3D/);
 assert.match(ui,/report\.finalistsVolumeChecked\+' programas examinados en 2,5D/);
 assert.match(ui,/CAD OEM y recorridos CNC SIN VERIFICAR/);
});
