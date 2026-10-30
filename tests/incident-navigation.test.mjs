import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {incidentReviewRows} from '../incident-navigation.js';

test('la navegación conserva signos, orden 1-2-4-3 y tiempos de operación',()=>{
 const result=incidentReviewRows(EXAMPLE,{issues:[],perOperation:[]},
  {operations:EXAMPLE.order.map(()=>({samples:6}))});
 assert.deepEqual(result.map(x=>x.bend),[0,1,3,2]);
 assert.deepEqual(result.map(x=>x.angle),[90,-90,90,-90]);
 assert.deepEqual(result.map(x=>x.time),[2.7,7.7,12.7,17.7]);
 assert.ok(result.every(x=>x.verified===false&&x.category==='none'));
});
test('un aviso de herramienta salta a la muestra más grave sin declararla contacto real',()=>{
 const result=incidentReviewRows(EXAMPLE,{issues:[],perOperation:[]},
  {operations:[null,{samples:6,exampleTime:8.75,
   example:{category:'penetration',kind:'punch',segment:1,depth:.4}},null,null]});
 const row=result[1];
 assert.equal(row.operation,1);
 assert.equal(row.bend,1);
 assert.equal(row.angle,-90);
 assert.equal(row.category,'penetration');
 assert.equal(row.time,8.75);
 assert.equal(row.hasToolSample,true);
 assert.match(row.summary,/penetración/i);
 assert.match(row.summary,/punzón/);
 assert.equal(row.verified,false);
});
test('aviso geométrico sin ejemplo de herramienta lleva al medio del golpe',()=>{
 const geometry={issues:[{bend:3,level:'warning',message:'Ala pequeña en V'}],
  perOperation:[{},{},{vSupportWarning:true},{}]};
 const result=incidentReviewRows(EXAMPLE,geometry,{operations:[]});
 assert.equal(result[2].bend,3);
 assert.equal(result[2].category,'geometry');
 assert.equal(result[2].time,12.7);
 assert.match(result[2].summary,/Ala pequeña/);
 assert.equal(result[2].hasToolSample,false);
});

test('un cruce de alas prevalece ante holgura menor y salta al instante muestreado',()=>{
 const geometry={issues:[],perOperation:[],sheetScan:{operations:[
  null,{exampleTime:7.45,samples:16,example:{finding:{kind:'cross',segments:[0,3],clearance:0}}}
 ]}};
 const tool={operations:[null,{exampleTime:7.75,samples:6,example:
  {category:'clearance',kind:'punch',depth:2}}]};
 const row=incidentReviewRows(EXAMPLE,geometry,tool)[1];
 assert.equal(row.bend,1);
 assert.equal(row.angle,-90);
 assert.equal(row.category,'sheet-cross');
 assert.equal(row.time,7.45);
 assert.equal(row.hasSheetSample,true);
 assert.equal(row.hasToolSample,false);
 assert.match(row.summary,/alas 1 y 4/);
 assert.equal(row.verified,false);
});
test('una penetración de útil prevalece frente a mera cercanía entre alas',()=>{
 const geometry={issues:[],perOperation:[],sheetScan:{operations:[
  {exampleTime:2.1,example:{finding:{kind:'close',segments:[0,2],clearance:1.2}}}
 ]}};
 const tool={operations:[{exampleTime:2.5,example:{category:'penetration',kind:'die',depth:1}}]};
 const row=incidentReviewRows(EXAMPLE,geometry,tool)[0];
 assert.equal(row.category,'penetration');
 assert.equal(row.time,2.5);
 assert.equal(row.hasSheetSample,false);
});
