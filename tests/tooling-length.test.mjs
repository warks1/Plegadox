import test from 'node:test';
import assert from 'node:assert/strict';
import {DIES,PUNCHES,EXAMPLE} from '../engine.js';
import {recommendTooling} from '../tooling-advisor.js';

const twoBend={...EXAMPLE,flanges:[50,50],angles:[90],order:[0],width:500};
const die=DIES.find(t=>t.id==='v16');
const punch=PUNCHES.find(t=>t.id==='straight88');

test('no recomendar una matriz de 415 mm para una pieza de 500 mm',()=>{
 assert.ok(die&&punch);
 const result=recommendTooling(twoBend,{
  dies:[{...die,length:415}],
  punches:[{...punch,length:600}]
 });
 assert.equal(result.choice,null);
 assert.match(result.reasons.join(' '),/ancho útil/);
});
test('no recomendar punzón más corto que la pieza, aunque la V sea adecuada',()=>{
 const result=recommendTooling(twoBend,{
  dies:[{...die,length:600}],
  punches:[{...punch,length:415}]
 });
 assert.equal(result.choice,null);
});
test('una pareja de 500 mm nominales puede ser preseleccionada, no certificada',()=>{
 const result=recommendTooling(twoBend,{
  dies:[{...die,length:500}],
  punches:[{...punch,length:500}]
 });
 assert.ok(result.choice);
 assert.equal(result.choice.verified,false);
 assert.ok(result.choice.warnings.some(x=>x.includes('segmentos')));
});
test('alternativas automáticas respetan todas las longitudes declaradas',()=>{
 const result=recommendTooling(twoBend);
 for(const pair of [result.choice,...result.alternatives].filter(Boolean)){
  for(const [library,id] of [[DIES,pair.dieId],[PUNCHES,pair.punchId]]){
   const item=library.find(x=>x.id===id);
   assert.ok(item);
   if(Number.isFinite(Number(item.length))&&Number(item.length)>0)
    assert.ok(item.length>=twoBend.width,
     'Útil '+id+' de '+item.length+' mm es menor que pieza '+twoBend.width);
  }
 }
});
test('no se modifica la pieza al calcular alternativas',()=>{
 const before=structuredClone(twoBend);
 recommendTooling(twoBend);
 assert.deepEqual(twoBend,before);
});
