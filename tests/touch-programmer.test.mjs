import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {editTouchPiece} from '../touch-programmer.js';
test('el editor táctil cambia alas y ángulos con signo sin destruir secuencia ni topes',()=>{
 const start=normalized({...EXAMPLE,stopByBend:[2,1,2,1]});
 const longer=editTouchPiece(start,{type:'length',index:1,value:82.5});
 const signed=editTouchPiece(longer,{type:'angle',index:1,value:-135});
 assert.equal(signed.flanges[1],82.5);
 assert.equal(signed.angles[1],-135);
 assert.deepEqual(signed.order,[0,1,3,2]);
 assert.deepEqual(signed.stopByBend,[2,1,2,1]);
 assert.equal(start.flanges[1],50,'no muta el original');
 const flip=editTouchPiece(signed,{type:'invert',index:1});
 assert.equal(flip.angles[1],135);
});
test('tocar el extremo añade ala, bend, orden y referencia de tope sin índice huérfano',()=>{
 const p=normalized({...EXAMPLE,flanges:[100,80],angles:[90],order:[0],
  stopByBend:[2],gaugeSideByBend:['after']});
 const result=editTouchPiece(p,{type:'append',value:45});
 assert.deepEqual(result.flanges,[100,80,45]);
 assert.deepEqual(result.angles,[90,90]);
 assert.deepEqual(result.order,[0,1]);
 assert.deepEqual(result.stopByBend,[2,1]);
 assert.deepEqual(result.gaugeSideByBend,['after','auto']);
});
test('borrar ala elimina también pliegue/orden/topes asociados, sin dejar índices inválidos',()=>{
 const original=normalized({...EXAMPLE,stopByBend:[1,2,1,2]});
 const after=editTouchPiece(original,{type:'remove',index:2});
 assert.deepEqual(after.flanges,[50,50,50,50]);
 assert.deepEqual(after.angles,[90,-90,90]);
 assert.deepEqual(after.order,[0,2,1]);
 assert.deepEqual(after.stopByBend,[1,1,2]);
 assert.equal(after.gaugeSideByBend.length,3);
});
test('orden por toque guarda la permutación elegida sin modificar ángulos',()=>{
 const p=editTouchPiece(EXAMPLE,{type:'order',indices:[2,0,3,1]});
 assert.deepEqual(p.order,[2,0,3,1]);
 assert.deepEqual(p.angles,[90,-90,-90,90]);
});
test('valores fuera de rango o selecciones incompletas no llegan a los controles CNC',()=>{
 for(const action of [{type:'length',index:0,value:0},
  {type:'length',index:5,value:50},{type:'angle',index:1,value:-190},
  {type:'angle',index:4,value:90},{type:'order',indices:[0,1,1,3]},
  {type:'remove',index:0},{type:'append',value:0}]){
  assert.throws(()=>editTouchPiece(EXAMPLE,action),action.type);
 }
 let p=EXAMPLE;while(normalized(p).flanges.length<20)p=editTouchPiece(p,{type:'append',value:50});
 assert.throws(()=>editTouchPiece(p,{type:'append',value:50}),/Máximo/);
});
