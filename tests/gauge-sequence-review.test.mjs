import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {scanGaugeSequence,inspectGaugeOperation} from '../gauge-sequence-review.js';
import {auditForWorkshop} from '../workshop-audit.js';
import {V85_FACTORY} from '../machine-config.js';

test('omega: todas las operaciones y retiradas quedan muestreadas conservando signos, orden y tope',()=>{
 const piece=normalized(EXAMPLE),original=structuredClone(piece);
 const scan=scanGaugeSequence(piece);
 assert.equal(scan.operations.length,4);
 assert.equal(scan.samplesPerOperation,18);
 assert.equal(scan.verified,false);
 assert.equal(scan.warningCount,scan.operations.filter(o=>o.findings.length>0).length);
 for(const [index,op] of scan.operations.entries()){
  assert.equal(op.operation,index);
  assert.equal(op.bend,piece.order[index]);
  assert.equal(op.stopNumber,piece.stopByBend[op.bend]);
  assert.equal(op.samples,19);
  assert.ok(op.findings.every(x=>x.time>=index*5&&x.time<(index+1)*5));
  assert.equal(op.verified,false);
 }
 assert.deepEqual(piece,original);
 assert.deepEqual(piece.order,[0,1,3,2]);
 assert.deepEqual(piece.angles,[90,-90,-90,90]);
});
test('la selección real es por pliegue, no número de golpe ni un STOP global',()=>{
 const p=normalized({...EXAMPLE,stopByBend:[2,1,2,1]});
 const scan=scanGaugeSequence(p);
 assert.deepEqual(scan.operations.map(x=>x.stopNumber),[2,1,1,2]);
});
test('alarma de penetración durante retirada aparece con instante del golpe',()=>{
 const piece=EXAMPLE;
 const injection=(p,time)=>{
  const op=Math.min(p.order.length-1,Math.floor(time/5));
  const isWithdrawal=(time%5)>4;
  return {scene:{stage:{activeOperation:op,activeBend:p.order[op],
    phase:isWithdrawal?'Retirada':'Posicionamiento'},gaugeTransition:isWithdrawal?{point:{x:100,y:0}}:null},
   place:{stopNumber:p.stopByBend[p.order[op]]||1,freeEdge:true,
    sheetInFront:true,seat:{seated:true},contactEngaged:!isWithdrawal,
    gaugeInterference:{warning:isWithdrawal,kind:'penetracion',
     point:{x:25,y:2}}}};
 };
 const r=inspectGaugeOperation(piece,1,{samples:20,inspect:injection});
 assert.ok(r.possibleInterference);
 assert.equal(r.findings.length,1);
 assert.equal(r.example.kind,'penetracion');
 assert.ok(r.example.time>9);
 assert.equal(r.example.stopNumber,1);
 assert.equal(r.contactObserved,true);
 assert.equal(r.withdrawalObserved,true);
});
test('chapa presentada por detrás es aviso aunque no atraviese la sección',()=>{
 const fake=(p,time)=>({scene:{stage:{phase:'Posicionamiento',
  activeOperation:0,activeBend:0}},
  place:{stopNumber:2,freeEdge:true,sheetInFront:false,seat:{seated:true},
   contactEngaged:false,gaugeInterference:{warning:false}}});
 const op=inspectGaugeOperation(EXAMPLE,0,{samples:8,inspect:fake});
 assert.equal(op.findings[0].kind,'chapa-detras');
 assert.equal(op.contactObserved,false);
});
test('separa falta de apoyo y referencia a vértice interior',()=>{
 for(const [kind,place] of [['sin-asiento',{freeEdge:true,sheetInFront:true,
   seat:{seated:false}}],['referencia-interior',{freeEdge:false,sheetInFront:true,
   seat:{seated:true}}]]){
  const op=inspectGaugeOperation(EXAMPLE,0,{samples:8,inspect:(p,time)=>({
   scene:{stage:{phase:'Posicionamiento',activeOperation:0,activeBend:0}},
   place:{stopNumber:1,contactEngaged:false,
    gaugeInterference:{warning:false},...place}})});
  assert.equal(op.findings[0].kind,kind);
 }
});
test('entrada inválida nunca se interpreta como una secuencia segura',()=>{
 for(const n of [-1,4,1.4])assert.throws(()=>inspectGaugeOperation(EXAMPLE,n));
 for(const samples of [0,7,101,2.4])assert.throws(()=>
  inspectGaugeOperation(EXAMPLE,0,{samples}));
});
test('auditoría incluye avisos de tope sin dar aprobación industrial',()=>{
 const fakeScan={warningCount:1,contactNotObserved:1,
  operations:[{operation:0,bend:0,stopNumber:2,samples:18,
   contactObserved:false,findings:[{kind:'penetracion',time:3.8,
    reason:'Posible penetración 2D chapa/tope'}]}]};
 const empty={warningCount:0};
 const result=auditForWorkshop(EXAMPLE,{machine:V85_FACTORY,
  toolScan:empty,sheetScan:empty,gaugeScan:fakeScan});
 assert.equal(result.summary.gaugeWarnings,1);
 assert.equal(result.summary.gaugeContactNotObserved,1);
 assert.ok(result.issues.some(x=>x.code==='gauge-penetracion'&&x.bend===0));
 assert.ok(result.issues.some(x=>x.code==='gauge-unconfirmed'));
 assert.equal(result.canApproveForMachine,false);
 assert.equal(result.status,'SIN_VALIDACION_INDUSTRIAL');
});

test('muestra la retirada con mayor densidad para detectar movimientos breves',()=>{
 const checked=[];
 const inspect=(piece,time)=>{
  checked.push(time);
  return {scene:{stage:{activeOperation:0,activeBend:0,
   phase:time>=4.2?'Retirada':'Posicionamiento'},
   gaugeTransition:time>=4.2?{point:{x:100,y:0}}:null},
   place:{stopNumber:1,freeEdge:true,sheetInFront:true,
    seat:{seated:true},contactEngaged:time<4.2,
    gaugeInterference:{warning:false}}};
 };
 const result=inspectGaugeOperation(EXAMPLE,0,{samples:18,inspect});
 assert.equal(result.samples,19);
 assert.ok(checked.filter(t=>t>=4.2-1e-9).length>=10,
  'Al menos diez muestras en los últimos 0,8 segundos');
 assert.ok(checked.at(-1)>4.999&&checked.at(-1)<5,
  'La última muestra no debe atribuirse al golpe siguiente');
 assert.equal(result.withdrawalObserved,true);
});
