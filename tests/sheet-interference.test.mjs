import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,profile,stage} from '../engine.js';
import {inspectSheetFrame,scanSheetSequence,describeSheetIssue} from '../sheet-interference.js';

test('la omega estándar comienza plana y sin cruces',()=>{
 const frame=inspectSheetFrame(EXAMPLE,0);
 assert.equal(frame.time,0);
 assert.equal(frame.hasCross,false);
 assert.equal(frame.hasNear,false);
 assert.deepEqual(frame.issues,[]);
 assert.equal(frame.verified,false);
});
test('reconoce el cruce de dos alas no consecutivas sin herramienta CAD',()=>{
 const shape={flanges:[50,50,50,50],angles:[140,140,140],order:[0,1,2],thickness:2};
 const frame=inspectSheetFrame(shape,15);
 assert.ok(frame.hasCross,JSON.stringify(frame.issues));
 assert.equal(frame.issues[0].kind,'cross');
 assert.match(describeSheetIssue(frame.issues[0]),/CRUCE/);
 assert.deepEqual(frame.issues[0].segments,[0,2]);
});
test('la separación de fibras inferior al espesor genera contacto, no cruce',()=>{
 const shape={flanges:[50,50,50,50],angles:[90,90,90],order:[0,1,2],thickness:2};
 // Un extremo que toca debe notificarse sin declarar un cruce interior.
 const result=inspectSheetFrame(shape,15);
 assert.ok(result.issues.every(x=>['cross','overlap','touch','close'].includes(x.kind)));
 assert.equal(result.verified,false);
 const sample={kind:'close',clearance:1.25,segments:[0,3]};
 assert.match(describeSheetIssue(sample),/1.25 mm/);
});
test('el escáner vincula cada muestra a su golpe y a su tiempo',()=>{
 const shape={flanges:[50,50,50,50],angles:[140,140,140],order:[0,1,2],thickness:2};
 const scan=scanSheetSequence(shape,15);
 assert.equal(scan.operations.length,3);
 assert.deepEqual(scan.operations.map(x=>x.bend),[0,1,2]);
 assert.ok(scan.operations.every(x=>x.samples===16));
 const last=scan.operations[2];
 assert.ok(last.possibleSheetInterference);
 assert.ok(last.exampleTime>=10&&last.exampleTime<=15);
 assert.equal(last.example?.finding.kind,'cross');
 assert.equal(scan.verified,false);
});
test('el orden 1-2-4-3 se mantiene y ningún aviso es aprobación',()=>{
 const scan=scanSheetSequence(EXAMPLE,8);
 assert.deepEqual(scan.operations.map(x=>x.bend),[0,1,3,2]);
 assert.ok(scan.operations.every(x=>x.verified===false&&x.samples===9));
 assert.equal(scan.verified,false);
});

test('un cuadrado que sólo cierra sobre el extremo inicial es CONTACTO, no CRUCE',()=>{
 const shape={flanges:[50,50,50,50],angles:[90,90,90],order:[0,1,2],thickness:2};
 const frame=inspectSheetFrame(shape,15);
 assert.ok(frame.issues.some(i=>i.kind==='touch'));
 assert.equal(frame.hasCross,false);
 assert.equal(frame.hasNear,true);
 assert.match(describeSheetIssue(frame.issues.find(i=>i.kind==='touch')),/CONTACTO PUNTUAL/);
});

test('el regreso sobre un tramo previo se clasifica como solapamiento colineal',()=>{
 const shape={flanges:[50,50,50,50],angles:[120,120,120],order:[0,1,2],thickness:2};
 const frame=inspectSheetFrame(shape,15);
 assert.equal(frame.hasCross,true);
 assert.ok(frame.issues.some(x=>x.kind==='overlap'));
 assert.match(describeSheetIssue(frame.issues.find(x=>x.kind==='overlap')),/SOLAPAMIENTO/);
});

test('el diagnóstico incorpora coordenadas 2D si existe una localización geométrica',()=>{
 const msg=describeSheetIssue({kind:'cross',segments:[0,2],point:{x:12.3456,y:-4.5678}});
 assert.match(msg,/CRUCE/);
 assert.match(msg,/X 12.35 mm, Y -4.57 mm/);
 assert.match(msg,/fibra media 2D/);
 const missing=describeSheetIssue({kind:'touch',segments:[0,3]});
 assert.match(missing,/CONTACTO PUNTUAL/);
 assert.doesNotMatch(missing,/undefined|NaN/);
});

test('el último muestreo antes de cada cambio de golpe se atribuye al golpe correcto',()=>{
 const result=scanSheetSequence(EXAMPLE,6);
 const entries=result.operations;
 assert.equal(entries.length,4);
 for(let i=0;i<entries.length;i++){
  const t=entries[i].lastSampleTime;
  assert.equal(stage(EXAMPLE,t).activeOperation,i,
   'No convertir el final del golpe G'+(i+1)+' en el inicio de G'+(i+2));
  if(i<entries.length-1){
   assert.ok(t<(i+1)*5,'Muestra final anterior a frontera');
   assert.ok((i+1)*5-t<.00001,'Muestra suficientemente próxima al final');
  }else assert.equal(t,20,'Último golpe incluye la pieza terminada');
 }
 assert.ok(entries.every(x=>x.samples===7));
});
