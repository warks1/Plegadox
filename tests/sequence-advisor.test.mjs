import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {sequenceCandidates,scoreBendOrder,suggestBendOrder} from '../sequence-advisor.js';
test('genera 24 secuencias exactas para 4 golpes y empieza por el orden programado',()=>{
 const arr=sequenceCandidates(EXAMPLE.order);
 assert.equal(arr.length,24);
 assert.deepEqual(arr[0],[0,1,3,2]);
 assert.equal(new Set(arr.map(x=>x.join(','))).size,24);
 assert.ok(arr.every(a=>new Set(a).size===4));
});
test('con 6 o 20 pliegues se limita el análisis para no bloquear la interfaz',()=>{
 for(const n of [6,20]){
  const candidates=sequenceCandidates(Array.from({length:n},(_,i)=>i),40);
  assert.ok(candidates.length<=40);
  assert.deepEqual(candidates[0],Array.from({length:n},(_,i)=>i));
  assert.ok(candidates.every(a=>a.length===n&&new Set(a).size===n));
 }
});
test('comparador mantiene intacta la pieza y sólo propone mejora estricta',()=>{
 const baseline=structuredClone(EXAMPLE),result=suggestBendOrder(EXAMPLE);
 assert.deepEqual(EXAMPLE,baseline);
 assert.equal(result.compared,24);
 assert.equal(result.exhaustive,true);
 assert.equal(result.verified,false);
 assert.deepEqual(result.current.order,[0,1,3,2]);
 assert.ok(result.best.score<=result.current.score);
 assert.deepEqual(result.order,result.improved?result.best.order:result.current.order);
 assert.equal(result.current.sampledPositions,20);
 assert.ok(Object.values(result.current.counts).every(n=>n>=0&&Number.isInteger(n)));
});
test('una única operación nunca inventa una alternativa',()=>{
 const p={flanges:[50,50],angles:[-90],order:[0],thickness:2};
 const r=suggestBendOrder(p);
 assert.equal(r.compared,1);
 assert.equal(r.improved,false);
 assert.deepEqual(r.order,[0]);
 assert.equal(r.current.score,r.best.score);
});
test('el comparador es determinista y preserva signos y disposición final',()=>{
 const p={flanges:[50,50,50,50],angles:[140,140,-140],
  order:[2,0,1],thickness:2};
 const a=suggestBendOrder(p),b=suggestBendOrder(p);
 assert.deepEqual(a,b);
 assert.deepEqual(p.order,[2,0,1]);
 assert.deepEqual(p.angles,[140,140,-140]);
 assert.equal(scoreBendOrder(p,a.order).score,a.best.score);
});
test('la puntuación penaliza los cruces más que la mera proximidad',()=>{
 const shape={flanges:[50,50,50,50],angles:[140,140,140],order:[0,1,2],
  thickness:2};
 const score=scoreBendOrder(shape,[0,1,2]);
 assert.ok(score.counts.cross>0,'La figura de ensayo tiene cruces');
 assert.ok(score.score>=1000);
 assert.equal(score.verified,false);
});
