import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {inspectGaugeOperation} from '../gauge-sequence-review.js';
import {gaugeRiskStatus} from '../gauge-risk-status.js';
import {gaugeStatusCardLayout} from '../machine-visual.js';

const inspectWith=place=>(_piece,time)=>({
 scene:{stage:{activeOperation:0,activeBend:EXAMPLE.order[0],
  phase:'Posicionamiento'},gaugeTransition:null},
 place:{stopNumber:1,contactEngaged:false,geometryUnavailable:true,...place}
});

test('R103: holgura y ausencia de asiento aparecen juntas, sin llamarlas colisión',()=>{
 const result=inspectGaugeOperation(EXAMPLE,0,{samples:8,inspect:inspectWith({
  freeEdge:true,sheetInFront:true,seat:{seated:false},setupValid:false,
  setupReason:'Repisa baja sin contacto frontal',
  gaugeInterference:{warning:true,kind:'holgura',point:{x:48,y:1}}
 })});
 const kinds=result.findings.map(x=>x.kind);
 assert.ok(kinds.includes('holgura'));
 assert.ok(kinds.includes('sin-asiento'));
 assert.ok(kinds.includes('apoyo-invalido'));
 assert.equal(result.example.kind,'apoyo-invalido',
  'Un defecto de asiento se explica antes que una holgura no penetrante');
 assert.equal(result.contactObserved,false);
 assert.equal(result.verified,false);
});

test('R103: la chapa detrás del dedo no desaparece detrás de un aviso de holgura',()=>{
 const result=inspectGaugeOperation(EXAMPLE,0,{samples:8,inspect:inspectWith({
  freeEdge:true,sheetInFront:false,seat:{seated:true},setupValid:true,
  gaugeInterference:{warning:true,kind:'holgura'}
 })});
 assert.ok(result.findings.some(f=>f.kind==='chapa-detras'));
 assert.ok(result.findings.some(f=>f.kind==='holgura'));
 assert.equal(result.example.kind,'chapa-detras');
});

test('R103: penetración prevalece sobre cualquier problema de referencia',()=>{
 const result=inspectGaugeOperation(EXAMPLE,0,{samples:8,inspect:inspectWith({
  freeEdge:false,foldedWingContact:false,setupValid:false,
  gaugeInterference:{warning:true,kind:'penetracion'}
 })});
 assert.equal(result.example.kind,'penetracion');
 assert.ok(result.findings.some(f=>f.kind==='referencia-interior'));
});

const nominal={
 phase:'Posicionamiento',freeEdge:true,sheetEdgeFound:true,
 sheetInFront:true,seat:{seated:true},setupValid:true,
 contact:{usable:true},gaugeDecision:{known:true,enabled:false},
 gaugeInterference:{kind:'sin-interferencia-detectada',warning:false},
 geometryUnavailable:true
};
const amberCode=(fields)=>gaugeRiskStatus({...nominal,...fields});

test('R103: causas naranja diferenciadas; sin penetración no se dibuja rojo',()=>{
 for(const [fields,expected] of [
  [{freeEdge:false,foldedWingContact:false},'referencia-interior'],
  [{sheetEdgeFound:false},'sin-borde-libre'],
  [{contact:{usable:false}},'cara-tope-invalida'],
  [{sheetInFront:false},'chapa-detras'],
  [{seat:{seated:false}},'sin-asiento'],
  [{setupValid:false},'apoyo-invalido']
 ]){
  const risk=amberCode(fields);
  assert.equal(risk.level,'amber');
  assert.equal(risk.code,expected);
  assert.equal(risk.verified,false);
  const layout=gaugeStatusCardLayout(480,320,220,150,1,
   risk.level,1,null,null,risk.code);
  assert.ok(layout.subline&&layout.subline!=='REVISAR APOYO / HOLGURA');
 }
});

test('R103: el golpe con penetración sigue rojo aunque el apoyo falle',()=>{
 const risk=amberCode({setupValid:false,sheetInFront:false,
  gaugeInterference:{kind:'penetracion',warning:true}});
 assert.equal(risk.level,'red');
 assert.equal(risk.code,'penetracion-actual');
});
